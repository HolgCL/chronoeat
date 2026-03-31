'use client'
import { useState, useEffect, useCallback } from 'react'
import { CheckCircle } from 'lucide-react'

type Gender = 'male' | 'female'
type Goal = 'lose' | 'maintain' | 'gain'

const GOALS: { value: Goal; label: string; desc: string; calorieAdj: number; proteinMult: number }[] = [
  { value: 'lose',     label: '🔥 Похудеть',        desc: 'Дефицит −20%, высокий белок',     calorieAdj: -0.20, proteinMult: 2.2 },
  { value: 'maintain', label: '⚖️ Поддерживать вес', desc: 'Поддержание, баланс макросов',    calorieAdj:  0,    proteinMult: 2.0 },
  { value: 'gain',     label: '💪 Набрать мышцы',   desc: 'Профицит +15%, акцент на белок',  calorieAdj: +0.15, proteinMult: 2.4 },
]

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

interface Macros { tdee: number; calories: number; protein: number; fat: number; carbs: number }

function calcMacros(gender: Gender, weight: number, height: number, age: number, steps: number, goal: Goal): Macros {
  const bmr      = calcBMR(gender, weight, height, age)
  const activity = getActivityLevel(steps)
  const tdee     = Math.round(bmr * activity.multiplier)
  const goalDef  = GOALS.find(g => g.value === goal)!
  const calories = Math.round(tdee * (1 + goalDef.calorieAdj))
  const protein  = Math.round(weight * goalDef.proteinMult)
  const fat      = Math.round((calories * 0.28) / 9)
  const carbs    = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))
  return { tdee, calories, protein, fat, carbs }
}

export default function CalculatorPage() {
  const [gender, setGender]     = useState<Gender>('male')
  const [age, setAge]           = useState(25)
  const [weight, setWeight]     = useState(75)
  const [height, setHeight]     = useState(175)
  const [steps, setSteps]       = useState(7000)
  const [goal, setGoal]         = useState<Goal>('maintain')
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

  const valid  = age > 0 && weight > 0 && height > 0
  const macros = valid ? calcMacros(gender, weight, height, age, steps, goal) : null
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

  const parseNum = (v: string, float?: boolean) => {
    const clean = v.replace(/[^\d.]/g, '')
    const n = float ? parseFloat(clean) : parseInt(clean, 10)
    return isNaN(n) ? 0 : n
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
            <input type="text" inputMode="numeric" value={age}
              onChange={e => setAge(parseNum(e.target.value))}
              onFocus={e => e.target.select()} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500">Вес (кг)</label>
            <input type="text" inputMode="decimal" value={weight}
              onChange={e => setWeight(parseNum(e.target.value, true))}
              onFocus={e => e.target.select()} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500">Рост (см)</label>
            <input type="text" inputMode="numeric" value={height}
              onChange={e => setHeight(parseNum(e.target.value))}
              onFocus={e => e.target.select()} className={inputCls} />
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

      {/* Goal */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">Цель</h2>
        <div className="grid grid-cols-1 gap-2">
          {GOALS.map(g => (
            <button
              key={g.value}
              onClick={() => setGoal(g.value)}
              className={`flex items-center justify-between rounded-xl px-4 py-3 border text-left transition-colors ${
                goal === g.value
                  ? 'border-[#1D9E75] bg-[#1D9E75]/10'
                  : 'border-neutral-700 hover:border-neutral-500'
              }`}
            >
              <span className={`text-sm font-medium ${goal === g.value ? 'text-[#1D9E75]' : 'text-neutral-200'}`}>
                {g.label}
              </span>
              <span className="text-xs text-neutral-500">{g.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {macros && (
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-neutral-300">Рекомендуемое КБЖУ на день</h2>
            {goal !== 'maintain' && (
              <span className="text-xs text-neutral-500">
                TDEE: {macros.tdee} ккал
                {goal === 'lose' ? ' → −20%' : ' → +15%'}
              </span>
            )}
          </div>

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
            {goal === 'lose'     && <p>• Дефицит 20% от TDEE — безопасное похудение ~0.5–1 кг/нед</p>}
            {goal === 'gain'     && <p>• Профицит 15% от TDEE — рост мышц с минимальным жиром</p>}
            {goal === 'maintain' && <p>• Калории равны расходу — поддержание текущего веса</p>}
            <p>• Белок: {GOALS.find(g => g.value === goal)!.proteinMult} г/кг — {goal === 'lose' ? 'защита мышц при дефиците' : goal === 'gain' ? 'строительный материал для мышц' : 'поддержание мышечной массы'}</p>
            <p>• Жиры: 28% от калорий — гормональный баланс</p>
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
