/**
 * Core circadian rhythm calculations for ChronoEat.
 * Based on published chronobiology research (MCTQ, PubMed hormone data).
 */

export type Chronotype =
  | 'extreme_morning'
  | 'morning'
  | 'intermediate'
  | 'evening'
  | 'extreme_evening'

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner'

/** Wake-up time offset in hours from the intermediate standard (7:00) */
const CHRONOTYPE_OFFSET: Record<Chronotype, number> = {
  extreme_morning: -2,
  morning:         -1,
  intermediate:     0,
  evening:         +1.5,
  extreme_evening: +3,
}

export interface ChronoScore {
  score: number
  zone: 'green' | 'yellow' | 'red'
  label: string
  tip: string
  cortisolLevel: number
  insulinSensitivity: number
  melatoninLevel: number
}

/**
 * Clamps a number to [0, 1].
 */
function clamp(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/**
 * Cortisol level at a given hour.
 * Peak occurs ~45 min after wake (Cortisol Awakening Response).
 * Baseline peaks around 08:00 for intermediate chronotype.
 * @param hour - Decimal hour (0–24)
 * @param offset - Chronotype offset in hours
 */
export function getCortisolLevel(hour: number, offset: number): number {
  const peak = 8.0 + offset // ~08:00 for intermediate
  const normalized = ((hour - peak + 24) % 24)
  // Fast rise, slow decay — cos approximation with 12h half-period
  const raw = 0.3 + 0.7 * Math.cos((normalized * Math.PI) / 12)
  return clamp(raw)
}

/**
 * Insulin sensitivity at a given hour.
 * Maximum sensitivity 10:00–14:00, drops sharply at night.
 * Inversely correlated with melatonin.
 * @param hour - Decimal hour (0–24)
 * @param offset - Chronotype offset in hours
 */
export function getInsulinSensitivity(hour: number, offset: number): number {
  const peak = 12.0 + offset
  const normalized = ((hour - peak + 24) % 24)
  const raw = 0.5 + 0.5 * Math.cos((normalized * Math.PI) / 14)
  return clamp(raw)
}

/**
 * Melatonin level at a given hour.
 * Near zero during the day, rises 2h before sleep (dim light melatonin onset).
 * For intermediate chronotype: onset ~21:00, peak ~02:00, suppressed by 08:00.
 * @param hour - Decimal hour (0–24)
 * @param offset - Chronotype offset in hours
 */
export function getMelatoninLevel(hour: number, offset: number): number {
  const onset = 21.0 + offset     // melatonin starts rising
  const peak  = 2.0  + offset     // night peak
  const suppressed = 8.0 + offset // morning suppression

  // Normalize to [0, 24)
  const h = ((hour + 24) % 24)

  // Simple sigmoid-like approximation
  const distFromOnset = ((h - onset + 24) % 24)
  const distFromSuppressed = ((suppressed - h + 24) % 24)

  if (distFromOnset <= 5) {
    // Rising phase: 0 → 1 over 5 hours
    return clamp(distFromOnset / 5)
  } else if (distFromSuppressed <= 3) {
    // Falling phase: 1 → 0 over 3 hours
    return clamp(distFromSuppressed / 3)
  } else if (distFromOnset <= 10) {
    // Night plateau
    return 0.9
  }
  // Daytime: near zero
  return 0.05
}

/**
 * Optimal eating window for a given chronotype.
 * Based on 10-hour feeding window recommendations from circadian nutrition research.
 * @param chronotype
 */
export function getEatingWindow(chronotype: Chronotype): { start: number; end: number } {
  const offset = CHRONOTYPE_OFFSET[chronotype]
  return { start: 8 + offset, end: 18 + offset }
}

/** Typical sleep schedule derived from chronotype. Hours wrapped to [0, 24). */
export function getSleepSchedule(chronotype: Chronotype): { wakeUp: number; bedtime: number } {
  const offset = CHRONOTYPE_OFFSET[chronotype]
  return { wakeUp: (7 + offset) % 24, bedtime: (23 + offset) % 24 }
}

/** Meal-type bonus: breakfast and lunch are metabolically favoured */
const MEAL_TYPE_BONUS: Record<MealType, number> = {
  breakfast: 10,
  lunch:      5,
  snack:      0,
  dinner:    -5,
}

/**
 * Compute a comprehensive chrono-score for a meal at a given time.
 * Score 0–100: green ≥ 70, yellow 40–69, red < 40.
 *
 * @param hour - Decimal hour of meal (0–24)
 * @param chronotype - User's chronotype
 * @param mealType - Type of meal
 * @returns ChronoScore object with score, zone, label, tip, and hormone levels
 */
export function computeChronoScore(
  hour: number,
  chronotype: Chronotype,
  mealType: MealType
): ChronoScore {
  const offset = CHRONOTYPE_OFFSET[chronotype]
  const insulin = getInsulinSensitivity(hour, offset)
  const melatonin = getMelatoninLevel(hour, offset)
  const cortisol = getCortisolLevel(hour, offset)

  // Cortisol bonus is highest in the morning (helps mobilise energy)
  const cortisolBonus = mealType === 'breakfast' ? cortisol : cortisol * 0.4

  const raw =
    insulin      * 50 +
    (1 - melatonin) * 35 +
    cortisolBonus   * 15 +
    MEAL_TYPE_BONUS[mealType]

  const score = Math.round(clamp(raw / 100) * 100)

  const window = getEatingWindow(chronotype)
  const inWindow = hour >= window.start && hour <= window.end

  let zone: ChronoScore['zone']
  let label: string
  let tip: string

  if (score >= 70) {
    zone = 'green'
    label = 'Отличное время'
    tip = _buildTip(mealType, 'green', insulin, melatonin, inWindow)
  } else if (score >= 40) {
    zone = 'yellow'
    label = 'Допустимо'
    tip = _buildTip(mealType, 'yellow', insulin, melatonin, inWindow)
  } else {
    zone = 'red'
    label = 'Метаболически сложно'
    tip = _buildTip(mealType, 'red', insulin, melatonin, inWindow)
  }

  return { score, zone, label, tip, cortisolLevel: cortisol, insulinSensitivity: insulin, melatoninLevel: melatonin }
}

function _buildTip(
  mealType: MealType,
  zone: 'green' | 'yellow' | 'red',
  insulin: number,
  melatonin: number,
  inWindow: boolean
): string {
  if (zone === 'green') {
    if (mealType === 'breakfast') return 'Отличное время — кортизол помогает усвоению, углеводы утилизируются хорошо'
    if (mealType === 'lunch')     return 'Пик инсулиновой чувствительности. Лучшее время для обеда!'
    if (mealType === 'snack')     return 'Хороший перекус. Добавь белок для насыщения'
    return 'В пределах оптимального окна питания'
  }
  if (zone === 'yellow') {
    if (melatonin > 0.3) return 'Мелатонин начинает расти. Выбирай белок и овощи вместо углеводов'
    if (!inWindow)       return 'Немного за пределами оптимального окна. Уменьши порцию'
    return 'Допустимо. Инсулиновая чувствительность снижается'
  }
  // red
  if (melatonin > 0.6) return 'Высокий мелатонин подавляет метаболизм. Если голоден — только белок'
  return 'Раннее или позднее время. Старайся есть в своё оптимальное окно'
}

/**
 * Macro distribution recommendation based on time of day.
 * Morning: more carbs. Evening: more protein/fat, fewer carbs.
 *
 * @param hour - Decimal hour (0–24)
 * @param chronotype
 */
export function getMacroRecommendation(
  hour: number,
  chronotype: Chronotype
): { carbRatio: number; proteinRatio: number; fatRatio: number; note: string } {
  const offset = CHRONOTYPE_OFFSET[chronotype]
  const insulin = getInsulinSensitivity(hour, offset)
  const melatonin = getMelatoninLevel(hour, offset)

  // Carbs are well handled when insulin sensitivity is high
  const carbRatio    = clamp(0.25 + insulin * 0.25 - melatonin * 0.1)
  const proteinRatio = clamp(0.30 + melatonin * 0.1)
  const fatRatio     = clamp(1 - carbRatio - proteinRatio)

  let note = ''
  if (insulin > 0.7) note = 'Сейчас организм хорошо справляется с углеводами'
  else if (melatonin > 0.4) note = 'Вечером делай акцент на белок, минимум углеводов'
  else note = 'Сбалансированный приём — добавь клетчатку'

  return { carbRatio, proteinRatio, fatRatio, note }
}

/**
 * Generate 24-hour hormone curve data for charts.
 * Returns array of { hour, cortisol, insulin, melatonin } every 30 minutes.
 *
 * @param chronotype
 */
export function getDayCurveData(chronotype: Chronotype, stepMinutes = 5) {
  const offset = CHRONOTYPE_OFFSET[chronotype]
  const step = stepMinutes / 60
  const count = Math.round(24 / step)
  const points = []
  for (let i = 0; i <= count; i++) {
    const hour = Math.min(i * step, 24)
    points.push({
      hour,
      cortisol:  Math.round(getCortisolLevel(hour, offset) * 100) / 100,
      insulin:   Math.round(getInsulinSensitivity(hour, offset) * 100) / 100,
      melatonin: Math.round(getMelatoninLevel(hour, offset) * 100) / 100,
    })
  }
  return points
}
