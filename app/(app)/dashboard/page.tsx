'use client'
import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Plus, Sparkles } from 'lucide-react'
import MealCard from '@/components/chrono/MealCard'
import EatingWindowBar from '@/components/chrono/EatingWindowBar'
import DayTimeline from '@/components/chrono/DayTimeline'
import MealLogger from '@/components/meals/MealLogger'
import MacroRing from '@/components/meals/MacroRing'
import ChronoScore from '@/components/chrono/ChronoScore'
import { computeChronoScore } from '@/lib/chrono'
import type { Chronotype, MealType } from '@/lib/chrono'
import { useAppStore, type MealEntry } from '@/store/useAppStore'

export default function DashboardPage() {
  const { todayMeals, setTodayMeals, addMeal, aiAdvice, setAiAdvice, setAiLoading } = useAppStore()
  const [showLogger, setShowLogger]   = useState(false)
  const [currentHour, setCurrentHour] = useState(new Date().getHours() + new Date().getMinutes() / 60)
  const [chronotype, setChronotype]   = useState<Chronotype>('intermediate')
  const [calorieGoal, setCalorieGoal] = useState(2000)

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(data => {
      if (data.chronotype) setChronotype(data.chronotype)
      if (data.calorieGoal) setCalorieGoal(data.calorieGoal)
    })
  }, [])

  // Tick current time every minute
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentHour(new Date().getHours() + new Date().getMinutes() / 60)
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const loadMeals = useCallback(async () => {
    const res = await fetch('/api/meals')
    if (res.ok) setTodayMeals(await res.json())
  }, [setTodayMeals])

  useEffect(() => { loadMeals() }, [loadMeals])

  const loadAiAdvice = useCallback(async () => {
    setAiLoading(true)
    setAiAdvice('')
    const res = await fetch('/api/ai-advice', { method: 'POST' })
    if (!res.ok || !res.body) { setAiLoading(false); return }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value)
      setAiAdvice(text)
    }
    setAiLoading(false)
  }, [setAiAdvice, setAiLoading])

  useEffect(() => { loadAiAdvice() }, [loadAiAdvice])

  const totalCalories = todayMeals.reduce((s, m) => s + m.calories, 0)
  const totalProtein  = todayMeals.reduce((s, m) => s + m.protein, 0)
  const avgChronoScore = todayMeals.length
    ? Math.round(todayMeals.reduce((s, m) => s + m.chronoScore, 0) / todayMeals.length)
    : 0

  const currentZone = computeChronoScore(currentHour, chronotype, 'snack')
  const firstMeal = todayMeals[0] ? new Date(todayMeals[0].loggedAt).getHours() + new Date(todayMeals[0].loggedAt).getMinutes() / 60 : undefined
  const lastMeal  = todayMeals.at(-1) ? new Date(todayMeals.at(-1)!.loggedAt).getHours() + new Date(todayMeals.at(-1)!.loggedAt).getMinutes() / 60 : undefined

  async function handleSaveMeal(data: { name: string; calories: number; protein: number; carbs: number; fat: number; mealType: MealType; loggedAt: string }) {
    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const meal = await res.json() as MealEntry
      addMeal(meal)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
          </p>
          <h1 className="text-2xl font-bold text-neutral-100">Сегодня</h1>
        </div>
        <ChronoScore score={currentZone.score} zone={currentZone.zone} size="lg" showLabel label={currentZone.label} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <MacroRing consumed={totalCalories} goal={calorieGoal} label="ккал" />
        <div className="flex flex-col justify-center gap-2">
          <div className="rounded-xl bg-neutral-800/50 p-3">
            <p className="text-xs text-neutral-400">Белок</p>
            <p className="text-lg font-bold text-neutral-100">{totalProtein.toFixed(0)}<span className="text-xs text-neutral-400">г</span></p>
          </div>
          <div className="rounded-xl bg-neutral-800/50 p-3">
            <p className="text-xs text-neutral-400">Хроно-балл</p>
            <p className="text-lg font-bold" style={{ color: avgChronoScore >= 70 ? '#1D9E75' : avgChronoScore >= 40 ? '#BA7517' : '#E24B4A' }}>
              {avgChronoScore}<span className="text-xs text-neutral-400">/100</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <button
            onClick={() => setShowLogger(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-700 p-4 text-neutral-400 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors h-full"
          >
            <Plus size={24} /><span className="text-xs">Добавить</span>
          </button>
        </div>
      </div>

      {/* Eating window */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
        <h2 className="text-sm font-semibold text-neutral-300 mb-3">Окно питания</h2>
        <EatingWindowBar
          chronotype={chronotype}
          firstMealHour={firstMeal}
          lastMealHour={lastMeal}
          currentHour={currentHour}
        />
      </div>

      {/* Day timeline */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
        <h2 className="text-sm font-semibold text-neutral-300 mb-3">Гормональные кривые дня</h2>
        <DayTimeline chronotype={chronotype} currentHour={currentHour} meals={todayMeals} />
      </div>

      {/* AI advice */}
      {(aiAdvice) && (
        <div className="rounded-xl bg-neutral-900 border border-[#1D9E75]/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-[#1D9E75]" />
            <h2 className="text-sm font-semibold text-[#1D9E75]">AI-совет на сегодня</h2>
          </div>
          <p className="text-sm text-neutral-300 whitespace-pre-line">{aiAdvice}</p>
        </div>
      )}

      {/* Meals list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-300">Приёмы пищи</h2>
        {todayMeals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center">
            <p className="text-neutral-500 text-sm">Нет приёмов пищи</p>
            <p className="text-xs text-neutral-600 mt-1">
              Сейчас {currentZone.label.toLowerCase()}. {currentZone.tip}
            </p>
          </div>
        ) : (
          todayMeals.map(meal => <MealCard key={meal.id} meal={meal} />)
        )}
      </div>

      {showLogger && (
        <MealLogger
          chronotype={chronotype}
          onSave={handleSaveMeal}
          onClose={() => setShowLogger(false)}
        />
      )}
    </div>
  )
}
