'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import FoodSearch from './FoodSearch'
import ChronoScore from '@/components/chrono/ChronoScore'
import type { FoodPortion } from '@/lib/food-search'
import type { MealType, Chronotype } from '@/lib/chrono'
import type { ChronoScore as ChronoScoreType } from '@/lib/chrono'

interface Props {
  chronotype: Chronotype
  onSave: (meal: {
    name: string; calories: number; protein: number; carbs: number;
    fat: number; mealType: MealType; loggedAt: string
  }) => Promise<void>
  onClose: () => void
  inline?: boolean
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch',     label: 'Обед' },
  { value: 'snack',     label: 'Перекус' },
  { value: 'dinner',    label: 'Ужин' },
]

export default function MealLogger({ chronotype, onSave, onClose, inline }: Props) {
  const [food, setFood]         = useState<FoodPortion | null>(null)
  const [grams, setGrams]       = useState(100)
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [time, setTime]         = useState(format(new Date(), 'HH:mm'))
  const [chronoPreview, setChronoPreview] = useState<ChronoScoreType | null>(null)
  const [saving, setSaving]     = useState(false)

  // Real-time chrono preview
  useEffect(() => {
    const [h, m] = time.split(':').map(Number)
    const hour = h + m / 60
    fetch(`/api/chrono-score?hour=${hour}&chronotype=${chronotype}&mealType=${mealType}`)
      .then(r => r.json())
      .then(setChronoPreview)
      .catch(() => {})
  }, [time, mealType, chronotype])

  const adjustedFood = food
    ? { ...food, calories: Math.round(food.caloriesPer100g * grams / 100), protein: +(food.proteinPer100g * grams / 100).toFixed(1), carbs: +(food.carbsPer100g * grams / 100).toFixed(1), fat: +(food.fatPer100g * grams / 100).toFixed(1) }
    : null

  async function handleSave() {
    if (!adjustedFood) return
    setSaving(true)
    const [h, m] = time.split(':').map(Number)
    const loggedAt = new Date()
    loggedAt.setHours(h, m, 0, 0)
    await onSave({
      name:     adjustedFood.name,
      calories: adjustedFood.calories,
      protein:  adjustedFood.protein,
      carbs:    adjustedFood.carbs,
      fat:      adjustedFood.fat,
      mealType,
      loggedAt: loggedAt.toISOString(),
    })
    setSaving(false)
    onClose()
  }

  const inner = (
    <div className={`w-full ${inline ? '' : 'max-w-md rounded-t-2xl sm:rounded-2xl'} bg-neutral-900 border border-neutral-700 p-5 space-y-4`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">Добавить приём пищи</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-100"><X size={20} /></button>
        </div>

        {/* Chrono preview */}
        {chronoPreview && (
          <div className="flex items-center gap-4 rounded-xl bg-neutral-800 p-3">
            <ChronoScore score={chronoPreview.score} zone={chronoPreview.zone} size="lg" showLabel label={chronoPreview.label} />
            <p className="text-sm italic text-neutral-400">{chronoPreview.tip}</p>
          </div>
        )}

        {/* Food search */}
        <FoodSearch onSelect={setFood} grams={grams} />

        {/* Grams */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-neutral-400 w-20">Порция (г)</label>
          <input
            type="number" min={1} max={2000} value={grams}
            onChange={e => setGrams(Number(e.target.value))}
            className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none"
          />
          {adjustedFood && (
            <span className="text-xs text-neutral-400">{adjustedFood.calories} ккал</span>
          )}
        </div>

        {/* Meal type */}
        <div className="flex gap-2 flex-wrap">
          {MEAL_TYPES.map(({ value, label }) => (
            <button
              key={value} type="button"
              onClick={() => setMealType(value)}
              className={`rounded-full px-3 py-1 text-sm border transition-colors ${mealType === value ? 'border-[#1D9E75] bg-[#1D9E75]/20 text-[#1D9E75]' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Time */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-neutral-400 w-20">Время</label>
          <input
            type="time" value={time}
            onChange={e => setTime(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!adjustedFood || saving}
          className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>
  )

  if (inline) return inner
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      {inner}
    </div>
  )
}
