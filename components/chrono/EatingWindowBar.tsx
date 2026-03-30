'use client'
import { getEatingWindow } from '@/lib/chrono'
import type { Chronotype } from '@/lib/chrono'
import { ZONE_COLORS } from '@/lib/utils'

interface Props {
  chronotype: Chronotype
  firstMealHour?: number
  lastMealHour?: number
  currentHour: number
}

export default function EatingWindowBar({ chronotype, firstMealHour, lastMealHour, currentHour }: Props) {
  const { start, end } = getEatingWindow(chronotype)
  const DAY = 24

  const pct = (h: number) => `${(h / DAY) * 100}%`

  const windowW = ((end - start) / DAY) * 100
  const eatW = lastMealHour != null && firstMealHour != null ? ((lastMealHour - firstMealHour) / DAY) * 100 : 0
  const eatL = firstMealHour != null ? (firstMealHour / DAY) * 100 : 0
  const eatingHours = lastMealHour != null && firstMealHour != null ? (lastMealHour - firstMealHour).toFixed(1) : null

  // Color the actual eating span based on overlap with optimal window
  const overlapStart = firstMealHour != null ? Math.max(firstMealHour, start) : start
  const overlapEnd   = lastMealHour  != null ? Math.min(lastMealHour,  end)   : end
  const overlap = firstMealHour != null && lastMealHour != null
    ? Math.max(0, overlapEnd - overlapStart) / (lastMealHour - firstMealHour || 1)
    : 0
  const spanColor = overlap >= 0.7 ? ZONE_COLORS.green : overlap >= 0.4 ? ZONE_COLORS.yellow : ZONE_COLORS.red

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>00:00</span>
        <span className="font-medium text-neutral-200">
          Окно питания: {String(Math.floor(start)).padStart(2,'0')}:00 – {String(Math.floor(end)).padStart(2,'0')}:00
          {eatingHours && <span className="ml-2 text-neutral-400">({eatingHours}ч сегодня)</span>}
        </span>
        <span>24:00</span>
      </div>

      <div className="relative h-5 rounded-full bg-neutral-800 overflow-hidden">
        {/* Optimal window */}
        <div
          className="absolute top-0 h-full rounded-full opacity-20"
          style={{ left: pct(start), width: `${windowW}%`, backgroundColor: ZONE_COLORS.green }}
        />
        {/* Actual eating span */}
        {firstMealHour != null && lastMealHour != null && (
          <div
            className="absolute top-1 h-3 rounded-full opacity-80"
            style={{ left: pct(firstMealHour), width: `${eatW}%`, backgroundColor: spanColor }}
          />
        )}
        {/* Current time marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white opacity-70"
          style={{ left: pct(currentHour) }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-neutral-500">
        <span>Ночь</span><span>Утро</span><span>День</span><span>Вечер</span><span>Ночь</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-6 rounded-full opacity-20" style={{ backgroundColor: ZONE_COLORS.green }} />
          Оптимальное окно
        </span>
        {firstMealHour != null && lastMealHour != null && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-6 rounded-full" style={{ backgroundColor: spanColor }} />
            Фактическое время еды ({overlap >= 0.7 ? 'в окне' : overlap >= 0.4 ? 'частично в окне' : 'вне окна'})
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-0.5 bg-white opacity-70" />
          Сейчас
        </span>
      </div>
    </div>
  )
}
