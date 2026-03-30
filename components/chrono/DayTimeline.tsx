'use client'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Scatter,
} from 'recharts'
import { getDayCurveData, getEatingWindow } from '@/lib/chrono'
import type { Chronotype } from '@/lib/chrono'
import { ZONE_COLORS } from '@/lib/utils'
import type { MealEntry } from '@/store/useAppStore'

interface Props {
  chronotype: Chronotype
  currentHour: number
  meals?: MealEntry[]
}

export default function DayTimeline({ chronotype, currentHour, meals = [] }: Props) {
  const data = getDayCurveData(chronotype)
  const window = getEatingWindow(chronotype)

  // Merge meal dots into chart data — only today's meals in local time
  const todayStr = new Date().toDateString()
  const mealDots = meals
    .filter(m => new Date(m.loggedAt).toDateString() === todayStr)
    .map(m => {
      const d = new Date(m.loggedAt)
      const h = d.getHours() + d.getMinutes() / 60
      return { hour: h, meal: m.chronoScore / 100, name: m.name, score: m.chronoScore, zone: m.chronoZone as 'green' | 'yellow' | 'red' }
    })

  const formatHour = (h: number) => {
    const hh = Math.floor(h)
    const mm = Math.round((h - hh) * 60)
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.4} />

          {/* Optimal eating window */}
          <ReferenceArea
            x1={window.start} x2={window.end}
            fill={ZONE_COLORS.green} fillOpacity={0.07}
            strokeOpacity={0}
          />

          <XAxis
            dataKey="hour"
            type="number"
            domain={[0, 24]}
            tickCount={9}
            tickFormatter={formatHour}
            stroke="#666"
            tick={{ fontSize: 11 }}
          />
          <YAxis domain={[0, 1]} tickCount={3} tick={{ fontSize: 11 }} stroke="#666" />

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-xs shadow-xl">
                  <p className="mb-1 font-semibold text-white">{formatHour(label as number)}</p>
                  {payload.map((p) => (
                    <p key={p.name} style={{ color: p.color }}>
                      {p.name}: {Number(p.value).toFixed(2)}
                    </p>
                  ))}
                </div>
              )
            }}
          />

          {/* Hormone curves */}
          <Area dataKey="cortisol"  name="Кортизол"  type="monotone" fill="#EF9F27" stroke="#EF9F27" fillOpacity={0.1} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          <Area dataKey="insulin"   name="Инсулин"   type="monotone" fill="#1D9E75" stroke="#1D9E75" fillOpacity={0.1} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          <Area dataKey="melatonin" name="Мелатонин" type="monotone" fill="#7F77DD" stroke="#7F77DD" fillOpacity={0.1} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />

          {/* Current time line */}
          <ReferenceLine
            x={currentHour}
            stroke="#fff"
            strokeWidth={2}
            strokeDasharray="4 2"
            label={{ value: 'сейчас', position: 'top', fill: '#aaa', fontSize: 10 }}
          />

          {/* Meal dots */}
          {mealDots.length > 0 && (
            <Scatter
              data={mealDots}
              dataKey="meal"
              fill="#fff"
              shape={(props: { cx?: number; cy?: number; payload?: typeof mealDots[0] }) => {
                const { cx = 0, cy = 0, payload } = props
                const color = payload ? ZONE_COLORS[payload.zone] : '#fff'
                return (
                  <circle
                    cx={cx} cy={cy} r={6}
                    fill={color} stroke="#111" strokeWidth={2}
                  />
                )
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-4 px-2 text-xs text-neutral-400">
        {[
          { color: '#EF9F27', label: 'Кортизол' },
          { color: '#1D9E75', label: 'Чувствительность к инсулину' },
          { color: '#7F77DD', label: 'Мелатонин' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="h-2 w-4 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded-full" style={{ backgroundColor: ZONE_COLORS.green, opacity: 0.4 }} />
          Окно питания
        </span>
      </div>
    </div>
  )
}
