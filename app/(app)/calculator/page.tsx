'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, Pencil, X } from 'lucide-react'

type Gender = 'male' | 'female'
type Goal = 'lose' | 'maintain' | 'gain'

const KCAL_PER_KG = 7700 // ккал в 1 кг жира/мышц

const GOAL_META: Record<Goal, { label: string; proteinMult: number }> = {
  lose:     { label: '🔥 Похудеть',        proteinMult: 2.2 },
  maintain: { label: '⚖️ Поддерживать вес', proteinMult: 2.0 },
  gain:     { label: '💪 Набрать мышцы',   proteinMult: 2.4 },
}

const STEPS_LEVELS = [
  { label: 'Малоподвижный',    range: '< 3 000',      min: 0,     max: 2999,  multiplier: 1.2   },
  { label: 'Слабо активный',   range: '3 000–7 000',  min: 3000,  max: 6999,  multiplier: 1.375 },
  { label: 'Умеренно активный',range: '7 000–10 000', min: 7000,  max: 9999,  multiplier: 1.55  },
  { label: 'Активный',         range: '10 000–15 000',min: 10000, max: 14999, multiplier: 1.725 },
  { label: 'Очень активный',   range: '> 15 000',     min: 15000, max: Infinity, multiplier: 1.9 },
]

function getActivityLevel(steps: number) {
  return STEPS_LEVELS.find(l => steps >= l.min && steps <= l.max) ?? STEPS_LEVELS[0]
}

/** Mifflin-St Jeor BMR */
function calcBMR(gender: Gender, weight: number, height: number, age: number) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

interface Macros { tdee: number; calories: number; protein: number; fat: number; carbs: number; dailyDelta: number }

function calcMacros(
  gender: Gender, weight: number, height: number, age: number, steps: number,
  goal: Goal, targetKg: number, weeks: number,
): Macros {
  const bmr        = calcBMR(gender, weight, height, age)
  const activity   = getActivityLevel(steps)
  const tdee       = Math.round(bmr * activity.multiplier)
  const meta       = GOAL_META[goal]

  // Daily kcal delta from target (0 for maintain)
  const dailyDelta = goal === 'maintain' ? 0
    : Math.round((targetKg * KCAL_PER_KG) / (weeks * 7)) * (goal === 'lose' ? -1 : 1)

  // Safety cap: deficit ≤ 1000 kcal/day, surplus ≤ 500 kcal/day
  const cappedDelta = goal === 'lose'
    ? Math.max(dailyDelta, -1000)
    : Math.min(dailyDelta, 500)

  const calories = Math.max(1200, tdee + cappedDelta)
  const protein  = Math.round(weight * meta.proteinMult)
  const fat      = Math.round((calories * 0.28) / 9)
  const carbs    = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))
  return { tdee, calories, protein, fat, carbs, dailyDelta: cappedDelta }
}

export default function CalculatorPage() {
  const [gender, setGender]     = useState<Gender>('male')
  const [age, setAge]           = useState(25)
  const [weight, setWeight]     = useState(75)
  const [height, setHeight]     = useState(175)
  const [steps, setSteps]       = useState(7000)
  const [goal, setGoal]         = useState<Goal>('maintain')
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  // per-goal targets: { kg, weeks }
  const [targets, setTargets]   = useState<Record<'lose' | 'gain', { kg: number; weeks: number }>>({
    lose: { kg: 3, weeks: 8 },
    gain: { kg: 2, weeks: 8 },
  })
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(false)

  // Load persisted body params
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(data => {
      if (data.gender)     setGender(data.gender as Gender)
      if (data.age)        setAge(data.age)
      if (data.weight)     setWeight(data.weight)
      if (data.height)     setHeight(data.height)
      if (data.dailySteps) setSteps(data.dailySteps)
    })
  }, [])

  const valid  = age > 0 && weight > 0 && height > 0
  const currentTarget = goal !== 'maintain' ? targets[goal as 'lose' | 'gain'] : { kg: 0, weeks: 1 }
  const macros = valid ? calcMacros(gender, weight, height, age, steps, goal, currentTarget.kg, currentTarget.weeks) : null
  const activity = getActivityLevel(steps)

  async function handleSave() {
    if (!macros) return
    setLoading(true)
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gender, age, weight, height, dailySteps: steps,
        calorieGoal: macros.calories,
        proteinGoal: macros.protein,
      }),
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const parseNum = (v: string, float?: boolean) => {
    const clean = v.replace(/[^\d.]/g, '')
    const n = float ? parseFloat(clean) : parseInt(clean, 10)
    return isNaN(n) ? 0 : n
  }

  const inputCls = 'w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-[#1D9E75] transition-colors'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wide">Питание</p>
        <h1 className="text-2xl font-bold text-neutral-100">Калькулятор КБЖУ</h1>
        <p className="text-xs text-neutral-500 mt-1">Расчёт по формуле Миффлина–Сан Жеора с учётом активности</p>
      </div>

      {/* Body params */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-300">Параметры тела</h2>

        {/* Gender */}
        <div className="flex gap-2">
          {(['male', 'female'] as Gender[]).map(g => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium border transition-colors ${
                gender === g
                  ? 'border-[#1D9E75] bg-[#1D9E75]/20 text-[#1D9E75]'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              {g === 'male' ? '♂ Мужчина' : '♀ Женщина'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500">Возраст (лет)</label>
            <input type="text" inputMode="numeric" value={age}
              onChange={e => setAge(parseNum(e.target.value))}
              onFocus={e => e.target.select()} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500">Вес (кг)</label>
            <input type="text" inputMode="decimal" value={weight}
              onChange={e => setWeight(parseNum(e.target.value, true))}
              onFocus={e => e.target.select()} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500">Рост (см)</label>
            <input type="text" inputMode="numeric" value={height}
              onChange={e => setHeight(parseNum(e.target.value))}
              onFocus={e => e.target.select()} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-neutral-300">Активность</h2>
          <span className="text-xs text-[#1D9E75] font-medium">{activity.label}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Шагов в день: <span className="text-neutral-200 font-medium">{steps.toLocaleString('ru')}</span></span>
            <span>{activity.range}</span>
          </div>
          <input
            type="range" min={0} max={20000} step={500} value={steps}
            onChange={e => setSteps(Number(e.target.value))}
            className="w-full accent-[#1D9E75]"
          />
          <div className="flex justify-between text-[10px] text-neutral-600">
            {STEPS_LEVELS.map(l => <span key={l.label}>{l.min === 0 ? '0' : l.min >= 15000 ? '15k+' : `${l.min/1000}k`}</span>)}
          </div>
        </div>

        {/* Activity levels */}
        <div className="flex gap-1.5 flex-wrap">
          {STEPS_LEVELS.map(l => (
            <button
              key={l.label}
              onClick={() => setSteps(l.min === 0 ? 1500 : l.min === 15000 ? 17000 : Math.round((l.min + Math.min(l.max, 14999)) / 2))}
              className={`rounded-full px-2.5 py-1 text-[11px] border transition-colors ${
                activity.label === l.label
                  ? 'border-[#1D9E75] bg-[#1D9E75]/20 text-[#1D9E75]'
                  : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">Цель</h2>
        <div className="grid grid-cols-1 gap-2">
          {(['lose', 'maintain', 'gain'] as Goal[]).map(g => {
            const meta = GOAL_META[g]
            const t = g !== 'maintain' ? targets[g as 'lose' | 'gain'] : null
            const isActive = goal === g
            const isEditing = editingGoal === g
            return (
              <div
                key={g}
                className={`rounded-xl border transition-colors ${
                  isActive ? 'border-[#1D9E75] bg-[#1D9E75]/10' : 'border-neutral-700'
                }`}
              >
                {/* Row */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <button className="flex-1 text-left" onClick={() => setGoal(g)}>
                    <span className={`text-sm font-medium ${isActive ? 'text-[#1D9E75]' : 'text-neutral-200'}`}>
                      {meta.label}
                    </span>
                    {t && (
                      <span className="ml-2 text-xs text-neutral-500">
                        {g === 'lose' ? '−' : '+'}{t.kg} кг за {t.weeks} нед.
                      </span>
                    )}
                  </button>
                  {g !== 'maintain' && (
                    <button
                      onClick={() => setEditingGoal(isEditing ? null : g)}
                      className="rounded-lg p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700/50 transition-colors"
                    >
                      {isEditing ? <X size={13} /> : <Pencil size={13} />}
                    </button>
                  )}
                </div>

                {/* Inline editor */}
                {isEditing && t && (
                  <div className="px-4 pb-3 space-y-2 border-t border-neutral-700/50 pt-3">
                    <p className="text-xs text-neutral-500">
                      {g === 'lose' ? 'Похудеть на' : 'Набрать'}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="text" inputMode="decimal" value={t.kg}
                          onChange={e => {
                            const n = parseFloat(e.target.value.replace(/[^\d.]/g,''))
                            if (!isNaN(n)) setTargets(prev => ({ ...prev, [g]: { ...prev[g as 'lose'|'gain'], kg: n } }))
                          }}
                          onFocus={e => e.target.select()}
                          className="w-16 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 outline-none focus:border-[#1D9E75] text-center"
                        />
                        <span className="text-xs text-neutral-400">кг</span>
                      </div>
                      <span className="text-xs text-neutral-500">за</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text" inputMode="numeric" value={t.weeks}
                          onChange={e => {
                            const n = parseInt(e.target.value.replace(/\D/g,''), 10)
                            if (!isNaN(n) && n > 0) setTargets(prev => ({ ...prev, [g]: { ...prev[g as 'lose'|'gain'], weeks: n } }))
                          }}
                          onFocus={e => e.target.select()}
                          className="w-16 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 outline-none focus:border-[#1D9E75] text-center"
                        />
                        <span className="text-xs text-neutral-400">нед.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Results */}
      {macros && (
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-neutral-300">Рекомендуемое КБЖУ на день</h2>
            <span className="text-xs text-neutral-500">
              TDEE: {macros.tdee} ккал
              {macros.dailyDelta !== 0 && (
                <span style={{ color: macros.dailyDelta < 0 ? '#E24B4A' : '#1D9E75' }}>
                  {' '}{macros.dailyDelta > 0 ? '+' : ''}{macros.dailyDelta}
                </span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Калории',  value: macros.calories, unit: 'ккал', color: '#1D9E75' },
              { label: 'Белки',    value: macros.protein,  unit: 'г',    color: '#EF9F27' },
              { label: 'Жиры',     value: macros.fat,      unit: 'г',    color: '#E24B4A' },
              { label: 'Углеводы', value: macros.carbs,    unit: 'г',    color: '#7F77DD' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="rounded-xl bg-neutral-800 p-3 text-center space-y-0.5">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] text-neutral-500">{unit}</p>
              </div>
            ))}
          </div>

          {/* Macro breakdown bar */}
          <div className="space-y-1">
            <div className="flex rounded-full overflow-hidden h-2">
              <div style={{ width: `${(macros.protein * 4 / macros.calories) * 100}%`, backgroundColor: '#EF9F27' }} />
              <div style={{ width: `${(macros.fat * 9 / macros.calories) * 100}%`, backgroundColor: '#E24B4A' }} />
              <div style={{ width: `${(macros.carbs * 4 / macros.calories) * 100}%`, backgroundColor: '#7F77DD' }} />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-600">
              <span className="text-[#EF9F27]">Б {Math.round(macros.protein * 4 / macros.calories * 100)}%</span>
              <span className="text-[#E24B4A]">Ж {Math.round(macros.fat * 9 / macros.calories * 100)}%</span>
              <span className="text-[#7F77DD]">У {Math.round(macros.carbs * 4 / macros.calories * 100)}%</span>
            </div>
          </div>

          <div className="rounded-lg bg-neutral-800 p-3 text-xs text-neutral-400 space-y-1">
            {goal === 'lose' && currentTarget.kg > 0 && (
              <p>• Темп: −{(currentTarget.kg / currentTarget.weeks).toFixed(1)} кг/нед — {(currentTarget.kg / currentTarget.weeks) <= 1 ? 'безопасно ✓' : 'агрессивно, следи за самочувствием'}</p>
            )}
            {goal === 'gain' && currentTarget.kg > 0 && (
              <p>• Темп: +{(currentTarget.kg / currentTarget.weeks).toFixed(1)} кг/нед — {(currentTarget.kg / currentTarget.weeks) <= 0.5 ? 'реалистично ✓' : 'часть может быть жир'}</p>
            )}
            {goal === 'maintain' && <p>• Калории равны расходу — поддержание текущего веса</p>}
            <p>• Белок: {GOAL_META[goal].proteinMult} г/кг — {goal === 'lose' ? 'защита мышц при дефиците' : goal === 'gain' ? 'строительный материал для мышц' : 'поддержание мышечной массы'}</p>
            <p>• Жиры: 28% от калорий — гормональный баланс</p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#178a64] transition-colors disabled:opacity-60"
          >
            {saved
              ? <><CheckCircle size={16} /> Сохранено как цель</>
              : loading ? 'Сохраняем...' : 'Сохранить как цель питания'}
          </button>
          {saved && (
            <p className="text-center text-xs text-neutral-500">
              Цели обновлены на дашборде
            </p>
          )}
        </div>
      )}
    </div>
  )
}
