import type { Chronotype } from './chrono'

export interface MCTQQuestion {
  id: string
  text: string
  options: { label: string; value: number }[]
}

/**
 * 5 key MCTQ questions. Each answer contributes a score 0–4.
 * Total 0–20 → maps to chronotype.
 */
export const MCTQ_QUESTIONS: MCTQQuestion[] = [
  {
    id: 'wakeup',
    text: 'В какое время ты обычно просыпаешься без будильника в выходной?',
    options: [
      { label: 'До 6:00',       value: 0 },
      { label: '6:00 – 7:30',   value: 1 },
      { label: '7:30 – 9:00',   value: 2 },
      { label: '9:00 – 10:30',  value: 3 },
      { label: 'После 10:30',   value: 4 },
    ],
  },
  {
    id: 'focus',
    text: 'Когда тебе легче всего сосредоточиться на сложной задаче?',
    options: [
      { label: 'Ранним утром (до 8:00)',       value: 0 },
      { label: 'Утром (8:00 – 10:00)',         value: 1 },
      { label: 'В середине дня (10:00–14:00)', value: 2 },
      { label: 'Днём / вечером (14:00–20:00)', value: 3 },
      { label: 'Поздно вечером (после 20:00)', value: 4 },
    ],
  },
  {
    id: 'sleep',
    text: 'В котором часу ты обычно засыпаешь?',
    options: [
      { label: 'До 21:00',            value: 0 },
      { label: '21:00 – 22:30',       value: 1 },
      { label: '22:30 – 00:00',       value: 2 },
      { label: '00:00 – 01:30',       value: 3 },
      { label: 'После 01:30',         value: 4 },
    ],
  },
  {
    id: 'morning_feel',
    text: 'Как ты себя чувствуешь в первый час после пробуждения?',
    options: [
      { label: 'Сразу бодр и активен',              value: 0 },
      { label: 'Достаточно хорошо',                  value: 1 },
      { label: 'Средне, нужно время "раскачаться"',   value: 2 },
      { label: 'Вялый, сложно сосредоточиться',       value: 3 },
      { label: 'Очень трудно, почти зомби',           value: 4 },
    ],
  },
  {
    id: 'work_time',
    text: 'Если бы ты мог выбирать рабочее время, когда бы ты начинал?',
    options: [
      { label: '5:00 – 8:00',   value: 0 },
      { label: '8:00 – 10:00',  value: 1 },
      { label: '10:00 – 12:00', value: 2 },
      { label: '12:00 – 14:00', value: 3 },
      { label: 'После 14:00',   value: 4 },
    ],
  },
]

/**
 * Determine chronotype from MCTQ answers.
 * @param answers - Map of questionId → selected value (0–4)
 * @returns Chronotype and estimated wake-up time
 */
export function determineChronotype(answers: Record<string, number>): {
  chronotype: Chronotype
  wakeUpTime: number
  sleepTime: number
} {
  const total = Object.values(answers).reduce((s, v) => s + v, 0)

  let chronotype: Chronotype
  if (total <= 3)       chronotype = 'extreme_morning'
  else if (total <= 7)  chronotype = 'morning'
  else if (total <= 12) chronotype = 'intermediate'
  else if (total <= 16) chronotype = 'evening'
  else                  chronotype = 'extreme_evening'

  // Estimate wake time from wakeup question
  const wakeAnswer = answers['wakeup'] ?? 2
  const wakeMap: Record<number, number> = { 0: 5.5, 1: 6.75, 2: 8.25, 3: 9.75, 4: 11.0 }
  const wakeUpTime = wakeMap[wakeAnswer] ?? 7.0

  // Estimate sleep time from sleep question
  const sleepAnswer = answers['sleep'] ?? 2
  const sleepMap: Record<number, number> = { 0: 20.5, 1: 21.75, 2: 23.25, 3: 0.75, 4: 2.0 }
  const sleepTime = sleepMap[sleepAnswer] ?? 23.0

  return { chronotype, wakeUpTime, sleepTime }
}

export const CHRONOTYPE_LABELS: Record<Chronotype, string> = {
  extreme_morning: 'Экстремальный жаворонок',
  morning:         'Жаворонок',
  intermediate:    'Промежуточный',
  evening:         'Сова',
  extreme_evening: 'Экстремальная сова',
}

export const CHRONOTYPE_DESCRIPTIONS: Record<Chronotype, string> = {
  extreme_morning: 'Твоё оптимальное окно питания: 06:00 – 16:00',
  morning:         'Твоё оптимальное окно питания: 07:00 – 17:00',
  intermediate:    'Твоё оптимальное окно питания: 08:00 – 18:00',
  evening:         'Твоё оптимальное окно питания: 09:30 – 19:30',
  extreme_evening: 'Твоё оптимальное окно питания: 11:00 – 21:00',
}
