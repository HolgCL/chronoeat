'use client'
import { getEatingWindow, getSleepSchedule } from '@/lib/chrono'
import type { Chronotype } from '@/lib/chrono'
import { ZONE_COLORS } from '@/lib/utils'

interface Props {
  chronotype: Chronotype
  firstMealHour?: number
  lastMealHour?: number
  currentHour: number
}

function fmt(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function EatingWindowBar({ chronotype, firstMealHour, lastMealHour, currentHour }: Props) {
  const { start, end } = getEatingWindow(chronotype)
  const { wakeUp: wakeUpTime, bedtime: sleepTime } = getSleepSchedule(chronotype)
  const DAY = 24
  const pct  = (h: number) => `${(h / DAY) * 100}%`
  const wpct = (h: number) => `${(h / DAY) * 100}%`

  const hasMeals = firstMealHour != null && lastMealHour != null
  const duration = hasMeals ? lastMealHour! - firstMealHour! : null

  const overlapStart = hasMeals ? Math.max(firstMealHour!, start) : start
  const overlapEnd   = hasMeals ? Math.min(lastMealHour!, end)   : end
  const overlap    = hasMeals ? Math.max(0, overlapEnd - overlapStart) / (duration! || 1) : 0
  const overlapPct = Math.round(overlap * 100)
  const spanColor  = overlap >= 0.7 ? ZONE_COLORS.green : overlap >= 0.4 ? ZONE_COLORS.yellow : ZONE_COLORS.red

  const firstOk    = hasMeals && firstMealHour! >= start && firstMealHour! <= end
  const lastOk     = hasMeals && lastMealHour!  >= start && lastMealHour!  <= end
  const durationOk = duration != null && duration <= (end - start)

  // Sleep zones: from 0 to wakeUpTime, and from sleepTime to 24
  // A meal is "during sleep" if it's before wakeUpTime or after sleepTime
  const firstDuringSleep = hasMeals && (firstMealHour! < wakeUpTime || firstMealHour! > sleepTime)
  const lastDuringSleep  = hasMeals && (lastMealHour!  < wakeUpTime || lastMealHour!  > sleepTime)

  return (
    <div className="space-y-4">

      {/* ── Stat chips ── */}
      {hasMeals && (
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: 'Первый приём',
              value: fmt(firstMealHour!),
              color: firstDuringSleep ? ZONE_COLORS.red : firstOk ? ZONE_COLORS.green : ZONE_COLORS.yellow,
              sub:   firstDuringSleep ? '😴 сон' : firstOk ? 'в окне' : 'вне окна',
            },
            {
              label: 'Последний',
              value: fmt(lastMealHour!),
              color: lastDuringSleep ? ZONE_COLORS.red : lastOk ? ZONE_COLORS.green : ZONE_COLORS.yellow,
              sub:   lastDuringSleep ? '😴 сон' : lastOk ? 'в окне' : 'вне окна',
            },
            {
              label: 'Длина окна',
              value: `${duration!.toFixed(1)}ч`,
              color: durationOk ? ZONE_COLORS.green : ZONE_COLORS.yellow,
              sub:   durationOk ? 'норма' : 'слишком долго',
            },
            {
              label: 'В окне',
              value: `${overlapPct}%`,
              color: spanColor,
              sub:   overlapPct >= 70 ? 'отлично' : overlapPct >= 40 ? 'частично' : 'вне окна',
            },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="rounded-xl bg-neutral-800 p-2.5 text-center space-y-0.5">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide leading-tight">{label}</p>
              <p className="text-base font-bold leading-tight" style={{ color }}>{value}</p>
              <p className="text-[10px] leading-tight" style={{ color, opacity: 0.7 }}>{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Timeline ── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-neutral-600">
          <span>00:00</span>
          <span className="text-neutral-400 font-medium">
            Оптимально: {String(Math.floor(start)).padStart(2, '0')}:00 – {String(Math.floor(end)).padStart(2, '0')}:00
          </span>
          <span>24:00</span>
        </div>

        <div className="relative h-7 rounded-full bg-neutral-800/80 overflow-hidden">

          {/* Sleep zones — two cases:
              normal (bedtime > wakeUp, e.g. 23→7): zones at [0, wakeUp] and [bedtime, 24]
              wrapped (bedtime < wakeUp, e.g. 2→10): single zone [bedtime, wakeUp] */}
          {sleepTime > wakeUpTime ? (
            <>
              <div className="absolute top-0 h-full" style={{ left: 0, width: wpct(wakeUpTime), backgroundColor: '#7F77DD', opacity: 0.15 }} />
              <div className="absolute top-0 h-full" style={{ left: pct(sleepTime), width: wpct(DAY - sleepTime), backgroundColor: '#7F77DD', opacity: 0.15 }} />
            </>
          ) : (
            <div className="absolute top-0 h-full" style={{ left: pct(sleepTime), width: wpct(wakeUpTime - sleepTime), backgroundColor: '#7F77DD', opacity: 0.15 }} />
          )}

          {/* Optimal eating window */}
          <div
            className="absolute top-0 h-full"
            style={{ left: pct(start), width: `${((end - start) / DAY) * 100}%`, backgroundColor: ZONE_COLORS.green, opacity: 0.18 }}
          />

          {/* Actual eating span line */}
          {hasMeals && duration! > 0 && (
            <div
              className="absolute rounded-full"
              style={{
                top: '11px', height: '4px',
                left: pct(firstMealHour!),
                width: `${(duration! / DAY) * 100}%`,
                backgroundColor: spanColor,
                opacity: 0.9,
              }}
            />
          )}

          {/* First meal dot */}
          {hasMeals && (
            <div
              className="absolute rounded-full border-2 border-neutral-900"
              style={{
                top: '7px', width: '12px', height: '12px',
                left: `calc(${pct(firstMealHour!)} - 6px)`,
                backgroundColor: firstDuringSleep ? ZONE_COLORS.red : firstOk ? ZONE_COLORS.green : ZONE_COLORS.yellow,
              }}
            />
          )}

          {/* Last meal dot */}
          {hasMeals && lastMealHour !== firstMealHour && (
            <div
              className="absolute rounded-full border-2 border-neutral-900"
              style={{
                top: '7px', width: '12px', height: '12px',
                left: `calc(${pct(lastMealHour!)} - 6px)`,
                backgroundColor: lastDuringSleep ? ZONE_COLORS.red : lastOk ? ZONE_COLORS.green : ZONE_COLORS.yellow,
              }}
            />
          )}

          {/* Sleep zone emoji labels */}
          {sleepTime > wakeUpTime ? (
            <>
              {wakeUpTime > 0.5 && (
                <div className="absolute top-0 h-full flex items-center justify-center" style={{ left: 0, width: wpct(wakeUpTime) }}>
                  <span className="text-[9px] text-[#7F77DD] opacity-80 select-none">😴</span>
                </div>
              )}
              {DAY - sleepTime > 0.5 && (
                <div className="absolute top-0 h-full flex items-center justify-center" style={{ left: pct(sleepTime), width: wpct(DAY - sleepTime) }}>
                  <span className="text-[9px] text-[#7F77DD] opacity-80 select-none">😴</span>
                </div>
              )}
            </>
          ) : (
            <div className="absolute top-0 h-full flex items-center justify-center" style={{ left: pct(sleepTime), width: wpct(wakeUpTime - sleepTime) }}>
              <span className="text-[9px] text-[#7F77DD] opacity-80 select-none">😴</span>
            </div>
          )}

          {/* Current time marker */}
          <div
            className="absolute top-0 h-full w-0.5 rounded-full bg-white opacity-60"
            style={{ left: pct(currentHour) }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-neutral-600">
          <span>Ночь</span><span>Утро</span><span>День</span><span>Вечер</span><span>Ночь</span>
        </div>

        {/* Mini legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-neutral-600 pt-0.5">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-full" style={{ backgroundColor: '#7F77DD', opacity: 0.4 }} />
            Сон ({fmt(sleepTime > wakeUpTime ? sleepTime : sleepTime)}–{fmt(wakeUpTime)})
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-full" style={{ backgroundColor: ZONE_COLORS.green, opacity: 0.4 }} />
            Оптимальное окно
          </span>
          {hasMeals && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-4 rounded-full" style={{ backgroundColor: spanColor }} />
              Фактически
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-0.5 rounded-full bg-white opacity-60" />
            Сейчас
          </span>
        </div>
      </div>
    </div>
  )
}
