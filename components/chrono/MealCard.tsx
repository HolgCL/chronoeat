import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import ChronoScore from './ChronoScore'
import { ZONE_BG } from '@/lib/utils'
import type { MealEntry } from '@/store/useAppStore'

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch:     'Обед',
  snack:     'Перекус',
  dinner:    'Ужин',
}

interface Props { meal: MealEntry }

export default function MealCard({ meal }: Props) {
  const zone = meal.chronoZone as 'green' | 'yellow' | 'red'

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${ZONE_BG[zone]}`}>
      <ChronoScore score={meal.chronoScore} zone={zone} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-semibold text-neutral-100">{meal.name}</p>
          <span className="shrink-0 text-xs text-neutral-400">
            {format(new Date(meal.loggedAt), 'HH:mm', { locale: ru })}
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
          <span className="rounded bg-neutral-700/50 px-1.5 py-0.5">
            {MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType}
          </span>
          <span>{meal.calories} ккал</span>
          <span>Б {meal.protein}г</span>
          <span>У {meal.carbs}г</span>
          <span>Ж {meal.fat}г</span>
        </div>

        {meal.chronoTip && (
          <p className="mt-1 text-xs italic text-neutral-400">{meal.chronoTip}</p>
        )}
      </div>
    </div>
  )
}
