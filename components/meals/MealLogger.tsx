'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import FoodSearch from './FoodSearch'
import NumInput from '@/components/NumInput'
import type { FoodPortion } from '@/lib/food-search'
import type { MealType } from '@/lib/chrono'
import { useAppStore, t, type MealEntry } from '@/store/useAppStore'

interface Props {
  onSave: (meal: {
    name: string; calories: number; protein: number; carbs: number;
    fat: number; mealType: MealType; loggedAt: string
  }) => Promise<void>
  onClose: () => void
  inline?: boolean
  initialMeal?: MealEntry
}

export default function MealLogger({ onSave, onClose, inline, initialMeal }: Props) {
  const { lang } = useAppStore()
  const tr = t[lang]

  const MEAL_TYPES: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: tr.mealTypes.breakfast },
    { value: 'lunch',     label: tr.mealTypes.lunch },
    { value: 'snack',     label: tr.mealTypes.snack },
    { value: 'dinner',    label: tr.mealTypes.dinner },
  ]

  const [food, setFood]         = useState<FoodPortion | null>(null)
  const [grams, setGrams]       = useState(100)
  const [mealType, setMealType] = useState<MealType>(initialMeal?.mealType as MealType ?? 'lunch')
  const [time, setTime]         = useState(
    initialMeal
      ? format(new Date(initialMeal.loggedAt), 'HH:mm')
      : format(new Date(), 'HH:mm')
  )
  const [saving, setSaving]     = useState(false)

  // When editing, show a manual nutrient override instead of food search
  const [manualMode, setManualMode] = useState(!!initialMeal)
  const [manualName, setManualName]         = useState(initialMeal?.name ?? '')
  const [manualCalories, setManualCalories] = useState(initialMeal?.calories ?? 0)
  const [manualProtein, setManualProtein]   = useState(initialMeal?.protein ?? 0)
  const [manualCarbs, setManualCarbs]       = useState(initialMeal?.carbs ?? 0)
  const [manualFat, setManualFat]           = useState(initialMeal?.fat ?? 0)


  const adjustedFood = food
    ? { ...food, calories: Math.round(food.caloriesPer100g * grams / 100), protein: +(food.proteinPer100g * grams / 100).toFixed(1), carbs: +(food.carbsPer100g * grams / 100).toFixed(1), fat: +(food.fatPer100g * grams / 100).toFixed(1) }
    : null

  async function handleSave() {
    const [h, m] = time.split(':').map(Number)
    const loggedAt = new Date()
    loggedAt.setHours(h, m, 0, 0)

    if (manualMode) {
      if (!manualName) return
      setSaving(true)
      await onSave({
        name:     manualName,
        calories: manualCalories,
        protein:  manualProtein,
        carbs:    manualCarbs,
        fat:      manualFat,
        mealType,
        loggedAt: loggedAt.toISOString(),
      })
    } else {
      if (!adjustedFood) return
      setSaving(true)
      await onSave({
        name:     adjustedFood.name,
        calories: adjustedFood.calories,
        protein:  adjustedFood.protein,
        carbs:    adjustedFood.carbs,
        fat:      adjustedFood.fat,
        mealType,
        loggedAt: loggedAt.toISOString(),
      })
    }
    setSaving(false)
    onClose()
  }

  const canSave = manualMode ? !!manualName : !!adjustedFood

  const inner = (
    <div className={`w-full ${inline ? '' : 'max-w-md rounded-t-2xl sm:rounded-2xl'} bg-neutral-900 border border-neutral-700 p-5 space-y-4`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">
            {initialMeal ? tr.logger.editTitle : tr.logger.addTitle}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-100"><X size={20} /></button>
        </div>


        {manualMode ? (
          /* Manual edit fields */
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-neutral-400 w-20">{tr.logger.name}</label>
              <input
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none"
              />
            </div>
            {[
              { label: tr.logger.calories,  value: manualCalories, set: setManualCalories },
              { label: tr.logger.proteinG,  value: manualProtein,  set: setManualProtein },
              { label: tr.logger.carbsG,    value: manualCarbs,    set: setManualCarbs },
              { label: tr.logger.fatG,      value: manualFat,      set: setManualFat },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center gap-3">
                <label className="text-sm text-neutral-400 w-20 shrink-0">{label}</label>
                <NumInput
                  value={value}
                  onChange={set}
                  className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none"
                />
              </div>
            ))}
            {!initialMeal && (
              <button onClick={() => setManualMode(false)} className="text-xs text-[#1D9E75] hover:underline">
                {tr.logger.searchDb}
              </button>
            )}
          </div>
        ) : (
          /* Food search */
          <div className="space-y-3">
            <FoodSearch onSelect={setFood} grams={grams} />
            <div className="flex items-center gap-3">
              <label className="text-sm text-neutral-400 w-20">{tr.logger.portion}</label>
              <NumInput
                value={grams}
                onChange={setGrams}
                className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none"
              />
              {adjustedFood && (
                <span className="text-xs text-neutral-400">{adjustedFood.calories} {tr.dash.kcal}</span>
              )}
            </div>
            <button onClick={() => setManualMode(true)} className="text-xs text-neutral-500 hover:text-neutral-300">
              {tr.logger.manualEntry}
            </button>
          </div>
        )}

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
          <label className="text-sm text-neutral-400 w-20">{tr.logger.time}</label>
          <input
            type="time" value={time}
            onChange={e => setTime(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          {saving ? tr.logger.saving : initialMeal ? tr.logger.saveChanges : tr.logger.save}
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
