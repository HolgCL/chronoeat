'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { MCTQ_QUESTIONS, determineChronotype } from '@/lib/chronotype'
import { getEatingWindow } from '@/lib/chrono'
import type { Chronotype } from '@/lib/chrono'

const CALORIE_GOALS = [1500, 1800, 2000, 2200, 2500, 3000]

const CHRONOTYPE_LABELS: Record<Chronotype, string> = {
  extreme_morning: 'Выраженный жаворонок',
  morning:         'Жаворонок',
  intermediate:    'Промежуточный',
  evening:         'Сова',
  extreme_evening: 'Выраженная сова',
}

function formatHour(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function SettingsPage() {
  const router = useRouter()
  const [chronotype, setChronotype] = useState<Chronotype>('intermediate')
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [proteinGoal, setProteinGoal] = useState(150)
  const [wakeUpTime, setWakeUpTime] = useState(7.0)
  const [sleepTime, setSleepTime]   = useState(23.0)
  const [showMctq, setShowMctq] = useState(false)
  const [answers, setAnswers] = useState<number[]>(Array(MCTQ_QUESTIONS.length).fill(3))
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(data => {
      if (data.chronotype) setChronotype(data.chronotype)
      if (data.calorieGoal) setCalorieGoal(data.calorieGoal)
      if (data.proteinGoal) setProteinGoal(data.proteinGoal)
      if (data.wakeUpTime != null) setWakeUpTime(data.wakeUpTime)
      if (data.sleepTime  != null) setSleepTime(data.sleepTime)
    })
  }, [])

  function handleAnswerChange(idx: number, val: number) {
    setAnswers(prev => { const a = [...prev]; a[idx] = val; return a })
  }

  function handleMctqFinish() {
    const { chronotype: ct } = determineChronotype(Object.fromEntries(answers.map((v, i) => [i, v])))
    setChronotype(ct)
    setShowMctq(false)
  }

  async function handleSave() {
    setSaveError(false)
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chronotype, calorieGoal, proteinGoal, wakeUpTime, sleepTime }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3000)
    }
  }

  const window_ = getEatingWindow(chronotype)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wide">Профиль</p>
        <h1 className="text-2xl font-bold text-neutral-100">Настройки</h1>
      </div>

      {/* Chronotype */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">Хронотип</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-neutral-100">{CHRONOTYPE_LABELS[chronotype]}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Окно питания: {formatHour(window_.start)} – {formatHour(window_.end)}
            </p>
          </div>
          <button
            onClick={() => setShowMctq(v => !v)}
            className="text-xs text-[#1D9E75] hover:underline"
          >
            {showMctq ? 'Свернуть' : 'Пересдать тест'}
          </button>
        </div>

        {showMctq && (
          <div className="space-y-4 pt-2 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">Отвечайте исходя из свободных дней без будильника</p>
            {MCTQ_QUESTIONS.map((q, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm text-neutral-300">{q.text}</p>
                <div className="flex gap-1">
                  {q.options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswerChange(i, opt.value)}
                      className={`flex-1 rounded-lg py-1.5 text-xs transition-colors border ${
                        answers[i] === opt.value
                          ? 'bg-[#1D9E75] border-[#1D9E75] text-white'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={handleMctqFinish}
              className="w-full rounded-lg bg-[#1D9E75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#178a64] transition-colors"
            >
              Применить
            </button>
          </div>
        )}

        {/* Manual chronotype select */}
        {!showMctq && (
          <div>
            <p className="text-xs text-neutral-500 mb-2">Или выберите вручную:</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CHRONOTYPE_LABELS) as [Chronotype, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setChronotype(key)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                    chronotype === key
                      ? 'border-[#1D9E75] bg-[#1D9E75]/20 text-[#1D9E75]'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calorie goal */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">Цель по калориям</h2>
        <div className="flex flex-wrap gap-2">
          {CALORIE_GOALS.map(g => (
            <button
              key={g}
              onClick={() => setCalorieGoal(g)}
              className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                calorieGoal === g
                  ? 'border-[#1D9E75] bg-[#1D9E75]/20 text-[#1D9E75]'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              {g} ккал
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500">Свое значение:</label>
          <input
            type="number" min={800} max={5000} value={calorieGoal}
            onChange={e => setCalorieGoal(Number(e.target.value))}
            className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none"
          />
          <span className="text-xs text-neutral-500">ккал/день</span>
        </div>
      </div>

      {/* Protein goal */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">Цель по белку</h2>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500">Граммов в день:</label>
          <input
            type="number" min={30} max={400} value={proteinGoal}
            onChange={e => setProteinGoal(Number(e.target.value))}
            className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none"
          />
          <span className="text-xs text-neutral-500">г/день</span>
        </div>
      </div>

      {/* Sleep schedule */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">Режим сна</h2>
        <p className="text-xs text-neutral-500">Используется для отображения зон сна на графике окна питания</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500 w-24">Подъём:</label>
            <input
              type="time"
              value={`${String(Math.floor(wakeUpTime)).padStart(2,'0')}:${String(Math.round((wakeUpTime % 1) * 60)).padStart(2,'0')}`}
              onChange={e => {
                const [h, m] = e.target.value.split(':').map(Number)
                setWakeUpTime(h + m / 60)
              }}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500 w-24">Отход ко сну:</label>
            <input
              type="time"
              value={`${String(Math.floor(sleepTime)).padStart(2,'0')}:${String(Math.round((sleepTime % 1) * 60)).padStart(2,'0')}`}
              onChange={e => {
                const [h, m] = e.target.value.split(':').map(Number)
                setSleepTime(h + m / 60)
              }}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors ${saveError ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1D9E75] hover:bg-[#178a64]'}`}
      >
        {saved ? '✓ Сохранено' : saveError ? 'Ошибка сохранения' : 'Сохранить настройки'}
      </button>

      {/* Sign out */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
        <h2 className="text-sm font-semibold text-neutral-300 mb-3">Аккаунт</h2>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Выйти из аккаунта
        </button>
      </div>

      {/* About */}
      <div className="text-center text-xs text-neutral-600 pb-4">
        ChronoEat v1.0 — питание по циркадным ритмам
      </div>
    </div>
  )
}
