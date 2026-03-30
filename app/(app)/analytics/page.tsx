'use client'
import { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend
} from 'recharts'
import type { MealEntry } from '@/store/useAppStore'

interface DayStats {
  date: string
  label: string
  calories: number
  protein: number
  avgChronoScore: number
  mealCount: number
}

function groupByDay(meals: MealEntry[]): DayStats[] {
  const map = new Map<string, MealEntry[]>()
  meals.forEach(m => {
    const key = format(new Date(m.loggedAt), 'yyyy-MM-dd')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  })
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ms]) => ({
      date,
      label: format(new Date(date), 'EEE d', { locale: ru }),
      calories: ms.reduce((s, m) => s + m.calories, 0),
      protein:  ms.reduce((s, m) => s + m.protein, 0),
      avgChronoScore: Math.round(ms.reduce((s, m) => s + m.chronoScore, 0) / ms.length),
      mealCount: ms.length,
    }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-neutral-800 border border-neutral-700 p-3 text-xs space-y-1">
      <p className="font-semibold text-neutral-200">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{Math.round(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DayStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Fetch meals for last 7 days by querying each day or use bulk endpoint
      const allMeals: MealEntry[] = []
      const tz = new Date().getTimezoneOffset()
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i).toLocaleDateString('en-CA')
        const res = await fetch(`/api/meals?date=${date}&tz=${tz}`)
        if (res.ok) {
          const meals = await res.json() as MealEntry[]
          allMeals.push(...meals)
        }
      }
      setData(groupByDay(allMeals))
      setLoading(false)
    }
    load()
  }, [])

  const avgScore = data.length ? Math.round(data.reduce((s, d) => s + d.avgChronoScore, 0) / data.length) : 0
  const avgCals  = data.length ? Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length) : 0
  const totalMeals = data.reduce((s, d) => s + d.mealCount, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wide">Последние 7 дней</p>
        <h1 className="text-2xl font-bold text-neutral-100">Аналитика</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <p className="text-xs text-neutral-500">Средний хроно-балл</p>
          <p className="text-2xl font-bold mt-1" style={{ color: avgScore >= 70 ? '#1D9E75' : avgScore >= 40 ? '#BA7517' : '#E24B4A' }}>
            {avgScore}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <p className="text-xs text-neutral-500">Ср. калорий/день</p>
          <p className="text-2xl font-bold text-neutral-100 mt-1">{avgCals}</p>
        </div>
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <p className="text-xs text-neutral-500">Приёмов пищи</p>
          <p className="text-2xl font-bold text-neutral-100 mt-1">{totalMeals}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-8 text-center text-neutral-500 text-sm">
          Загружаем данные...
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center text-neutral-500 text-sm">
          Нет данных за последние 7 дней
        </div>
      ) : (
        <>
          {/* Calories chart */}
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
            <h2 className="text-sm font-semibold text-neutral-300 mb-4">Калории и хроно-балл</h2>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="label" tick={{ fill: '#737373', fontSize: 11 }} />
                <YAxis yAxisId="cal" tick={{ fill: '#737373', fontSize: 11 }} />
                <YAxis yAxisId="score" orientation="right" domain={[0, 100]} tick={{ fill: '#737373', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#a3a3a3' }} />
                <Bar yAxisId="cal" dataKey="calories" name="Калории" fill="#3b82f6" opacity={0.7} radius={[4, 4, 0, 0]} />
                <Line yAxisId="score" dataKey="avgChronoScore" name="Хроно-балл" stroke="#1D9E75" strokeWidth={2} dot={{ fill: '#1D9E75', r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Protein chart */}
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
            <h2 className="text-sm font-semibold text-neutral-300 mb-4">Белок по дням (г)</h2>
            <ResponsiveContainer width="100%" height={160}>
              <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="label" tick={{ fill: '#737373', fontSize: 11 }} />
                <YAxis tick={{ fill: '#737373', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="protein" name="Белок (г)" fill="#f59e0b" opacity={0.8} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Day detail table */}
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
            <h2 className="text-sm font-semibold text-neutral-300 mb-3">По дням</h2>
            <div className="space-y-2">
              {data.map(d => (
                <div key={d.date} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                  <div>
                    <p className="text-sm text-neutral-200 capitalize">{d.label}</p>
                    <p className="text-xs text-neutral-500">{d.mealCount} приёмов пищи</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-sm font-semibold text-neutral-100">{d.calories}</p>
                      <p className="text-xs text-neutral-500">ккал</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: d.avgChronoScore >= 70 ? '#1D9E75' : d.avgChronoScore >= 40 ? '#BA7517' : '#E24B4A' }}>
                        {d.avgChronoScore}
                      </p>
                      <p className="text-xs text-neutral-500">балл</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
