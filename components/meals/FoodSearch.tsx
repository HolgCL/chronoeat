'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { fetchFoodByQuery, calculatePortion } from '@/lib/food-search'
import type { FoodItem, FoodPortion } from '@/lib/food-search'

interface Props {
  onSelect: (food: FoodPortion) => void
  grams: number
}

export default function FoodSearch({ onSelect, grams }: Props) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<FoodItem[]>([])
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const items = await fetchFoodByQuery(query)
      setResults(items)
      setOpen(true)
      setLoading(false)
    }, 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-neutral-400" /> : <Search className="h-4 w-4 text-neutral-400" />}
        <input
          type="text"
          placeholder="Поиск продукта..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-800 transition-colors"
              onClick={() => {
                onSelect(calculatePortion(item, grams))
                setQuery(item.name)
                setOpen(false)
              }}
            >
              <p className="font-medium text-neutral-100 truncate">{item.name}</p>
              <p className="text-xs text-neutral-400">
                {item.brand && <span>{item.brand} · </span>}
                {item.caloriesPer100g} ккал · Б {item.proteinPer100g}г · У {item.carbsPer100g}г · Ж {item.fatPer100g}г (на 100г)
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
