export interface FoodItem {
  id: string
  name: string
  brand?: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

export interface FoodPortion extends FoodItem {
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

function normalize(product: Record<string, unknown>): FoodItem | null {
  const nutriments = (product.nutriments ?? {}) as Record<string, unknown>
  const cal = Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0)
  if (!cal) return null
  return {
    id:             String(product.code ?? product.id ?? Math.random()),
    name:           String(product.product_name_ru ?? product.product_name ?? 'Без названия'),
    brand:          product.brands ? String(product.brands) : undefined,
    caloriesPer100g: cal,
    proteinPer100g:  Number(nutriments.proteins_100g ?? 0),
    carbsPer100g:    Number(nutriments.carbohydrates_100g ?? 0),
    fatPer100g:      Number(nutriments.fat_100g ?? 0),
  }
}

/**
 * Search Open Food Facts by query string.
 * Results are cached in sessionStorage to avoid repeated requests.
 */
export async function fetchFoodByQuery(query: string): Promise<FoodItem[]> {
  if (!query.trim()) return []

  const cacheKey = `food_search_${query.toLowerCase().trim()}`

  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached) as FoodItem[]
  }

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&lc=ru`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []

    const data = (await res.json()) as { products?: unknown[] }
    const items = (data.products ?? [])
      .map((p) => normalize(p as Record<string, unknown>))
      .filter((x): x is FoodItem => x !== null)
      .slice(0, 10)

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(cacheKey, JSON.stringify(items))
    }
    return items
  } catch {
    return []
  }
}

/**
 * Calculate nutrition for a given portion size.
 */
export function calculatePortion(food: FoodItem, grams: number): FoodPortion {
  const ratio = grams / 100
  return {
    ...food,
    grams,
    calories: Math.round(food.caloriesPer100g * ratio),
    protein:  Math.round(food.proteinPer100g  * ratio * 10) / 10,
    carbs:    Math.round(food.carbsPer100g    * ratio * 10) / 10,
    fat:      Math.round(food.fatPer100g      * ratio * 10) / 10,
  }
}
