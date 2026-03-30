'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MCTQ_QUESTIONS, determineChronotype } from '@/lib/chronotype'
import { getEatingWindow } from '@/lib/chrono'
import type { Chronotype } from '@/lib/chrono'
import ChronoScore from '@/components/chrono/ChronoScore'
import { computeChronoScore } from '@/lib/chrono'

type Step = 'profile' | 'mctq' | 'result'

const CHRONOTYPE_LABELS: Record<Chronotype, string> = {
  extreme_morning: 'Выраженный жаворонок',
  morning:         'Жаворонок',
  intermediate:    'Промежуточный',
  evening:         'Сова',
  extreme_evening: 'Выраженная сова',
}

const CHRONOTYPE_DESC: Record<Chronotype, string> = {
  extreme_morning: 'Вы встаёте очень рано и наиболее активны в первой половине дня.',
  morning:         'Вы жаворонок — продуктивны с утра, рано ложитесь спать.',
  intermediate:    'Ваши ритмы близки к среднестатистическим.',
  evening:         'Вы сова — энергия приходит к вечеру, трудно вставать рано.',
  extreme_evening: 'Вы выраженная сова — пик активности глубоко вечером.',
}

function formatHour(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('profile')
  const [answers, setAnswers] = useState<number[]>(Array(MCTQ_QUESTIONS.length).fill(3))
  const [chronotype, setChronotype] = useState<Chronotype>('intermediate')

  function handleAnswerChange(idx: number, val: number) {
    setAnswers(prev => { const a = [...prev]; a[idx] = val; return a })
  }

  function handleMctqSubmit() {
    const { chronotype: ct } = determineChronotype(Object.fromEntries(answers.map((v, i) => [i, v])))
    setChronotype(ct)
    setStep('result')
  }

  const window_ = getEatingWindow(chronotype)
  const noonScore = computeChronoScore(13, chronotype, 'lunch')
  const lateScore = computeChronoScore(22, chronotype, 'dinner')

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#1D9E75]">ChronoEat</h1>
          <div className="flex justify-center gap-2 mt-3">
            {(['profile', 'mctq', 'result'] as Step[]).map((s, i) => (
              <div key={s} className={`h-1.5 w-12 rounded-full transition-colors ${step === s || (step === 'result' && i <= 2) ? 'bg-[#1D9E75]' : 'bg-neutral-700'}`} />
            ))}
          </div>
        </div>

        {step === 'profile' && (
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">Добро пожаловать!</h2>
              <p className="text-sm text-neutral-400 mt-1">
                ChronoEat учитывает ваши циркадные ритмы, чтобы каждый приём пищи был в нужное время.
                Давайте определим ваш хронотип.
              </p>
            </div>
            <div className="rounded-lg bg-neutral-800/50 p-4 space-y-2 text-sm text-neutral-300">
              <p>🌅 <strong>Жаворонок</strong> — ранний подъём, оптимальное окно питания сдвинуто раньше</p>
              <p>🌙 <strong>Сова</strong> — поздний подъём, окно питания сдвинуто позже</p>
              <p>⚖️ <strong>Промежуточный</strong> — классическое окно 8–20 ч</p>
            </div>
            <button
              onClick={() => setStep('mctq')}
              className="w-full rounded-lg bg-[#1D9E75] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#178a64] transition-colors"
            >
              Пройти тест (5 вопросов) →
            </button>
          </div>
        )}

        {step === 'mctq' && (
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-neutral-100">Тест на хронотип</h2>
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

            <div className="flex gap-3">
              <button
                onClick={() => setStep('profile')}
                className="flex-1 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
              >
                ← Назад
              </button>
              <button
                onClick={handleMctqSubmit}
                className="flex-1 rounded-lg bg-[#1D9E75] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#178a64] transition-colors"
              >
                Узнать хронотип →
              </button>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-6 space-y-5">
            <div className="text-center space-y-1">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Ваш хронотип</p>
              <h2 className="text-2xl font-bold text-neutral-100">{CHRONOTYPE_LABELS[chronotype]}</h2>
              <p className="text-sm text-neutral-400">{CHRONOTYPE_DESC[chronotype]}</p>
            </div>

            <div className="rounded-lg bg-neutral-800/50 p-4">
              <p className="text-xs text-neutral-500 mb-2">Оптимальное окно питания</p>
              <p className="text-2xl font-bold text-[#1D9E75]">
                {formatHour(window_.start)} – {formatHour(window_.end)}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {Math.round(window_.end - window_.start)} часов приёма пищи
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-neutral-800/50 p-3 flex items-center gap-3">
                <ChronoScore score={noonScore.score} zone={noonScore.zone} size="sm" />
                <div>
                  <p className="text-xs text-neutral-400">Обед (13:00)</p>
                  <p className="text-sm font-semibold text-neutral-100">Балл {noonScore.score}</p>
                </div>
              </div>
              <div className="rounded-lg bg-neutral-800/50 p-3 flex items-center gap-3">
                <ChronoScore score={lateScore.score} zone={lateScore.zone} size="sm" />
                <div>
                  <p className="text-xs text-neutral-400">Поздний ужин (22:00)</p>
                  <p className="text-sm font-semibold text-neutral-100">Балл {lateScore.score}</p>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await fetch('/api/user', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chronotype }),
                })
                router.push('/dashboard')
              }}
              className="w-full rounded-lg bg-[#1D9E75] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#178a64] transition-colors"
            >
              Начать отслеживание →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
