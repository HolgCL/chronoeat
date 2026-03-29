'use client'
import { create } from 'zustand'

export interface MealEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: string
  loggedAt: string
  chronoScore: number
  chronoZone: string
  chronoTip?: string | null
}

interface AppStore {
  todayMeals:       MealEntry[]
  aiAdvice:         string
  aiLoading:        boolean
  currentHour:      number

  setTodayMeals:    (meals: MealEntry[]) => void
  addMeal:          (meal: MealEntry) => void
  setAiAdvice:      (text: string) => void
  setAiLoading:     (v: boolean) => void
  setCurrentHour:   (h: number) => void
}

export const useAppStore = create<AppStore>((set) => ({
  todayMeals:   [],
  aiAdvice:     '',
  aiLoading:    false,
  currentHour:  new Date().getHours() + new Date().getMinutes() / 60,

  setTodayMeals:  (meals) => set({ todayMeals: meals }),
  addMeal:        (meal)  => set((s) => ({ todayMeals: [...s.todayMeals, meal] })),
  setAiAdvice:    (text)  => set({ aiAdvice: text }),
  setAiLoading:   (v)     => set({ aiLoading: v }),
  setCurrentHour: (h)     => set({ currentHour: h }),
}))
