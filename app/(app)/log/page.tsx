'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MealLogger from '@/components/meals/MealLogger'
import type { Chronotype, MealType } from '@/lib/chrono'
import { useAppStore, type MealEntry } from '@/store/useAppStore'

export default function LogPage() {
  const router = useRouter()
  const { addMeal } = useAppStore()
  const [saved, setSaved] = useState(false)
  const [chronotype, setChronotype] = useState<Chronotype>('intermediate')

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(data => {
      if (data.chronotype) setChronotype(data.chronotype)
    })
  }, [])

  async function handleSaveMeal(data: { name: string; calories: number; protein: number; carbs: number; fat: number; mealType: MealType; loggedAt: string }) {
    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const meal = await res.json() as MealEntry
      addMeal(meal)
      setSaved(true)
      setTimeout(() => router.push('/dashboard'), 800)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <p className="text-xs text-neutral-500 uppercase tracking-wide">Быстрое добавление</p>
        <h1 className="text-2xl font-bold text-neutral-100">Новый приём пищи</h1>
      </div>

      {saved ? (
        <div className="rounded-xl bg-[#1D9E75]/10 border border-[#1D9E75]/30 p-8 text-center">
          <p className="text-[#1D9E75] font-semibold text-lg">Сохранено!</p>
          <p className="text-neutral-400 text-sm mt-1">Возвращаемся на главную...</p>
        </div>
      ) : (
        <MealLogger
          onSave={handleSaveMeal}
          onClose={() => router.push('/dashboard')}
          inline
        />
      )}
    </div>
  )
}
