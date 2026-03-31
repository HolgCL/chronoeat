'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }
    if (password !== confirm) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(res.status === 409 ? 'Этот email уже зарегистрирован' : 'Ошибка регистрации')
      return
    }

    // Auto sign-in after registration
    await signIn('credentials', { email, password, redirect: false })
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1D9E75]">ChronoEat</h1>
          <p className="text-neutral-400 text-sm mt-1">Питание по циркадным ритмам</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-neutral-900 border border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-100">Создать аккаунт</h2>

          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#1D9E75]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Пароль</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#1D9E75]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Повторите пароль</label>
            <input
              type="password" required value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#1D9E75]"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg bg-[#1D9E75] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#178a64] transition-colors disabled:opacity-50"
          >
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>

          <p className="text-center text-xs text-neutral-500">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-[#1D9E75] hover:underline">Войти</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
