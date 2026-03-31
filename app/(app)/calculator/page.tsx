'use client'
import { useState, useEffect, useCallback } from 'react'
import { CheckCircle } from 'lucide-react'

type Gender = 'male' | 'female'

const STEPS_LEVELS = [
  { label: 'Малоподвижный',    range: '< 3 000',      min: 0,     max: 2999,  multiplier: 1.2   },
  { label: 'Слабо активный',   range: '3 000–7 000',  min: 3000,  max: 6999,  multiplier: 1.375 },
  { label: 'Умеренно активный',range: '7 000–10 000', min: 7000,  max: 9999,  multiplier: 1.55  },
  { label: 'Активный',         range: '10 000–15 000',min: 10000, max: 14999, multiplier: 1.725 },
  { label: 'Очень активный',   range: '> 15 000',     min: 15000, max: Infinity, multiplier: 1.9 },
]

function getActivityLevel(steps: number) {
  return STEPS_LEVELS.find(l => steps >= l.min && steps <= l.max) ?? STEPS_LEVELS[0]
}

/** Mifflin-St Jeor BMR */
function calcBMR(gender: Gender, weight: number, height: number, age: number) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

interface Macros { calories: number; protein: number; fat: number; carbs: number }

function calcMacros(gender: Gender, weight: number, height: number, age: number, steps: number): Macros {
  const bmr = calcBMR(gender, weight, height, age)
  const activity = getActivityLevel(steps)
  const calories = Math.round(bmr * activity.multiplier)
  const protein  = Math.round(weight * 2.0)           // 2 г/кг
  const fat      = Math.round((calories * 0.28) / 9)  // 28% калорий
  const carbs    = Math.round((calories - protein * 4 - fat * 9) / 4)
  return { calories, protein, fat, carbs }
}

export default function CalculatorPage() {
  const [gender, setGender]     = useState<Gender>('male')
  const [age, setAge]           = useState(25)
  const [weight, setWeight]     = useState(75)
  const [height, setHeight]     = useState(175)
  const [steps, setSteps]       = useState(7000)
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(false)

  // Load persisted body params
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(data => {
      if (data.gender)     setGender(data.gender as Gender)
      if (data.age)        setAge(data.age)
      if (data.weight)     setWeight(data.weight)
      if (data.height)     setHeight(data.height)
      if (data.dailySteps) setSteps(data.dailySteps)
    })
  }, [])

  const valid = age > 0 && weight > 0 && height > 0 && steps >= 0
  const macros = valid ? calcMacros(gender, weight, height, age, steps) : null
  const activity = getActivityLevel(steps)

  async function handleSave() {
    if (!macros) return
    setLoading(true)
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gender, age, weight, height, dailySteps: steps,
        calorieGoal: macros.calories,
        proteinGoal: macros.protein,
      }),
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputCls = 'w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-[#1D9E75] transition-colors'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wide">Питание</p>
        <h1 className="text-2xl font-bold text-neutral-100">Калькулятор КБЖУ</h1>
        <p className="text-xs text-neutral-500 mt-1">Расчёт по формуле Миффлина–Сан Жеора с учётом активности</p>
      </div>

      {/* Body params */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-300">Параметры тела</h2>

        {/* Gender */}
        <div className="flex gap-2">
          {(['male', 'female'] as Gender[]).map(g => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium border transition-colors ${
                gender === g
                  ? 'border-[#1D9E75] bg-[#1D9E75]/20 text-[#1D9E75]'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              {g === 'male' ? '♂ Мужчина' : '♀ Женщина'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500">Возраст (лет)</label>
            <input type="number" min={10} max={100} value={age}
              onChange={e => setAge(Number(e.target.value))} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500">Вес (кг)</label>
            <input type="number" min={30} max={300} step={0.5} value={weight}
              onChange={e => setWeight(Number(e.target.value))} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500">Рост (см)</label>
            <input type="number" min={100} max={250} value={height}
              onChange={e => setHeight(Number(e.target.value))} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-neutral-300">Активность</h2>
          <span className="text-xs text-[#1D9E75] font-medium">{activity.label}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Шагов в день: <span className="text-neutral-200 font-medium">{steps.toLocaleString('ru')}</span></span>
            <span>{activity.range}</span>
          </div>
          <input
            type="range" min={0} max={20000} step={500} value={steps}
            onChange={e => setSteps(Number(e.target.value))}
            className="w-full accent-[#1D9E75]"
          />
          <div className="flex justify-between text-[10px] text-neutral-600">
            {STEPS_LEVELS.map(l => <span key={l.label}>{l.min === 0 ? '0' : l.min >= 15000 ? '15k+' : `${l.min/1000}k`}</span>)}
          </div>
        </div>

        {/* Activity levels */}
        <div className="flex gap-1.5 flex-wrap">
          {STEPS_LEVELS.map(l => (
            <button
              key={l.label}
              onClick={() => setSteps(l.min === 0 ? 1500 : l.min === 15000 ? 17000 : Math.round((l.min + Math.min(l.max, 14999)) / 2))}
              className={`rounded-full px-2.5 py-1 text-[11px] border transition-colors ${
                activity.label === l.label
                  ? 'border-[#1D9E75] bg-[#1D9E75]/20 text-[#1D9E75]'
                  : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {macros && (
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-300">Рекомендуемое КБЖУ на день</h2>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Калории',  value: macros.calories, unit: 'ккал', color: '#1D9E75' },
              { label: 'Белки',    value: macros.protein,  unit: 'г',    color: '#EF9F27' },
              { label: 'Жиры',     value: macros.fat,      unit: 'г',    color: '#E24B4A' },
              { label: 'Углеводы', value: macros.carbs,    unit: 'г',    color: '#7F77DD' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="rounded-xl bg-neutral-800 p-3 text-center space-y-0.5">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] text-neutral-500">{unit}</p>
              </div>
            ))}
          </div>

          {/* Macro breakdown bar */}
          <div className="space-y-1">
            <div className="flex rounded-full overflow-hidden h-2">
              <div style={{ width: `${(macros.protein * 4 / macros.calories) * 100}%`, backgroundColor: '#EF9F27' }} />
              <div style={{ width: `${(macros.fat * 9 / macros.calories) * 100}%`, backgroundColor: '#E24B4A' }} />
              <div style={{ width: `${(macros.carbs * 4 / macros.calories) * 100}%`, backgroundColor: '#7F77DD' }} />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-600">
              <span className="text-[#EF9F27]">Б {Math.round(macros.protein * 4 / macros.calories * 100)}%</span>
              <span className="text-[#E24B4A]">Ж {Math.round(macros.fat * 9 / macros.calories * 100)}%</span>
              <span className="text-[#7F77DD]">У {Math.round(macros.carbs * 4 / macros.calories * 100)}%</span>
            </div>
          </div>

          <div className="rounded-lg bg-neutral-800 p-3 text-xs text-neutral-400 space-y-1">
            <p>• Белок: 2 г на кг массы тела — поддержание мышц</p>
            <p>• Жиры: 28% от калорий — гормональный баланс</p>
            <p>• Углеводы: остаток калорий — топливо для дня</p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#178a64] transition-colors disabled:opacity-60"
          >
            {saved
              ? <><CheckCircle size={16} /> Сохранено как цель</>
              : loading ? 'Сохраняем...' : 'Сохранить как цель питания'}
          </button>
          {saved && (
            <p className="text-center text-xs text-neutral-500">
              Цели обновлены на дашборде
            </p>
          )}
        </div>
      )}
    </div>
  )
}
