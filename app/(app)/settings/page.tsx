'use client'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { MCTQ_QUESTIONS, determineChronotype } from '@/lib/chronotype'
import { getEatingWindow, getSleepSchedule } from '@/lib/chrono'
import type { Chronotype } from '@/lib/chrono'
import { useAppStore, t } from '@/store/useAppStore'
import NumInput from '@/components/NumInput'

const CALORIE_GOALS = [1500, 1800, 2000, 2200, 2500, 3000]

function formatHour(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function SettingsPage() {
  const { lang, setLang } = useAppStore()
  const tr = t[lang]
  const CHRONOTYPE_LABELS: Record<Chronotype, string> = tr.chronotypes

  const [chronotype, setChronotype] = useState<Chronotype>('intermediate')
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [proteinGoal, setProteinGoal] = useState(150)
  const [showMctq, setShowMctq] = useState(false)
  const [answers, setAnswers] = useState<number[]>(Array(MCTQ_QUESTIONS.length).fill(3))
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(data => {
      if (data.chronotype) setChronotype(data.chronotype)
      if (data.calorieGoal) setCalorieGoal(data.calorieGoal)
      if (data.proteinGoal) setProteinGoal(data.proteinGoal)
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
      body: JSON.stringify({ chronotype, calorieGoal, proteinGoal }),
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
  const sleep_  = getSleepSchedule(chronotype)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wide">{tr.settings.profile}</p>
        <h1 className="text-2xl font-bold text-neutral-100">{tr.settings.title}</h1>
      </div>

      {/* Language */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">{tr.settings.language}</h2>
        <div className="flex gap-2">
          {(['ru', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${
                lang === l
                  ? 'border-[#1D9E75] bg-[#1D9E75]/20 text-[#1D9E75]'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              {l === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
            </button>
          ))}
        </div>
      </div>

      {/* Chronotype */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">{tr.settings.chronotype}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-neutral-100">{CHRONOTYPE_LABELS[chronotype]}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {tr.settings.eatingWindowLabel}: {formatHour(window_.start)} – {formatHour(window_.end)}
            </p>
          </div>
          <button
            onClick={() => setShowMctq(v => !v)}
            className="text-xs text-[#1D9E75] hover:underline"
          >
            {showMctq ? tr.settings.collapse : tr.settings.retakeTest}
          </button>
        </div>

        {showMctq && (
          <div className="space-y-4 pt-2 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">{tr.settings.freedays}</p>
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
              {tr.settings.applyTest}
            </button>
          </div>
        )}

        {/* Manual chronotype select */}
        {!showMctq && (
          <div>
            <p className="text-xs text-neutral-500 mb-2">{tr.settings.manualSelect}</p>
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
        <h2 className="text-sm font-semibold text-neutral-300">{tr.settings.calorieGoal}</h2>
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
              {g} {tr.settings.kcalDay.replace('/день', '').replace('/day', '')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500">{tr.settings.customValue}</label>
          <NumInput
            value={calorieGoal}
            onChange={setCalorieGoal}
            className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none"
          />
          <span className="text-xs text-neutral-500">{tr.settings.kcalDay}</span>
        </div>
      </div>

      {/* Protein goal */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">{tr.settings.proteinGoal}</h2>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500">{tr.settings.gramsPerDay}</label>
          <NumInput
            value={proteinGoal}
            onChange={setProteinGoal}
            className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none"
          />
          <span className="text-xs text-neutral-500">{tr.settings.gramsDay}</span>
        </div>
      </div>

      {/* Sleep schedule — derived from chronotype */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-300">{tr.settings.sleepSchedule}</h2>
          <span className="text-xs text-neutral-500">{tr.settings.sleepByChronotype}</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg bg-neutral-800 p-3 text-center">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide">{tr.settings.wakeUp}</p>
            <p className="text-lg font-bold text-neutral-100 mt-0.5">{formatHour(sleep_.wakeUp)}</p>
          </div>
          <div className="flex-1 rounded-lg bg-neutral-800 p-3 text-center">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide">{tr.settings.bedtime}</p>
            <p className="text-lg font-bold text-neutral-100 mt-0.5">{formatHour(sleep_.bedtime)}</p>
          </div>
        </div>
        <p className="text-xs text-neutral-600">{tr.settings.changeChrono}</p>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors ${saveError ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1D9E75] hover:bg-[#178a64]'}`}
      >
        {saved ? tr.settings.saved : saveError ? tr.settings.saveError : tr.settings.save}
      </button>

      {/* Sign out */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
        <h2 className="text-sm font-semibold text-neutral-300 mb-3">{tr.settings.account}</h2>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          {tr.settings.signOut}
        </button>
      </div>

      {/* About */}
      <div className="text-center text-xs text-neutral-600 pb-4">
        ChronoEat v1.0
      </div>
    </div>
  )
}
