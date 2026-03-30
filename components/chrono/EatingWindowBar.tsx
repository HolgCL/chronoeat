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

function fmt(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function EatingWindowBar({ chronotype, firstMealHour, lastMealHour, currentHour }: Props) {
  const { start, end } = getEatingWindow(chronotype)
  const DAY = 24
  const pct = (h: number) => `${(h / DAY) * 100}%`

  const hasMeals = firstMealHour != null && lastMealHour != null
  const duration = hasMeals ? lastMealHour! - firstMealHour! : null

  const overlapStart = hasMeals ? Math.max(firstMealHour!, start) : start
  const overlapEnd   = hasMeals ? Math.min(lastMealHour!, end)   : end
  const overlap    = hasMeals ? Math.max(0, overlapEnd - overlapStart) / (duration! || 1) : 0
  const overlapPct = Math.round(overlap * 100)
  const spanColor  = overlap >= 0.7 ? ZONE_COLORS.green : overlap >= 0.4 ? ZONE_COLORS.yellow : ZONE_COLORS.red

  const firstOk = hasMeals && firstMealHour! >= start && firstMealHour! <= end
  const lastOk  = hasMeals && lastMealHour!  >= start && lastMealHour!  <= end
  const durationOk = duration != null && duration <= (end - start)

  return (
    <div className="space-y-4">

      {/* ── Stat chips ── */}
      {hasMeals && (
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: 'Первый приём',
              value: fmt(firstMealHour!),
              color: firstOk ? ZONE_COLORS.green : ZONE_COLORS.red,
              sub:   firstOk ? 'в окне' : 'вне окна',
            },
            {
              label: 'Последний',
              value: fmt(lastMealHour!),
              color: lastOk ? ZONE_COLORS.green : ZONE_COLORS.red,
              sub:   lastOk ? 'в окне' : 'вне окна',
            },
            {
              label: 'Длина окна',
              value: `${duration!.toFixed(1)}ч`,
              color: durationOk ? ZONE_COLORS.green : ZONE_COLORS.yellow,
              sub:   durationOk ? 'норма' : 'много',
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
              <p className="text-[10px]" style={{ color, opacity: 0.7 }}>{sub}</p>
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

        <div className="relative h-6 rounded-full bg-neutral-800/80">
          {/* Optimal window zone */}
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              left: pct(start),
              width: `${((end - start) / DAY) * 100}%`,
              backgroundColor: ZONE_COLORS.green,
              opacity: 0.18,
            }}
          />

          {/* Actual eating span */}
          {hasMeals && duration! > 0 && (
            <div
              className="absolute rounded-full"
              style={{
                top: '10px',
                height: '4px',
                left: pct(firstMealHour!),
                width: `${(duration! / DAY) * 100}%`,
                backgroundColor: spanColor,
                opacity: 0.85,
              }}
            />
          )}

          {/* First meal dot */}
          {hasMeals && (
            <div
              className="absolute rounded-full border-2 border-neutral-900"
              style={{
                top: '6px', width: '12px', height: '12px',
                left: `calc(${pct(firstMealHour!)} - 6px)`,
                backgroundColor: firstOk ? ZONE_COLORS.green : ZONE_COLORS.red,
              }}
            />
          )}

          {/* Last meal dot (only if different from first) */}
          {hasMeals && lastMealHour !== firstMealHour && (
            <div
              className="absolute rounded-full border-2 border-neutral-900"
              style={{
                top: '6px', width: '12px', height: '12px',
                left: `calc(${pct(lastMealHour!)} - 6px)`,
                backgroundColor: lastOk ? ZONE_COLORS.green : ZONE_COLORS.red,
              }}
            />
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
        <div className="flex gap-4 text-[10px] text-neutral-600 pt-0.5">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-full opacity-20" style={{ backgroundColor: ZONE_COLORS.green }} />
            Оптимальное окно
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-4 rounded-full" style={{ backgroundColor: spanColor || '#888' }} />
            Фактически
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-0.5 rounded-full bg-white opacity-60" />
            Сейчас
          </span>
        </div>
      </div>
    </div>
  )
}
