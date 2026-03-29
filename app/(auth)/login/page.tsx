'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      email, password, redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('Неверный email или пароль')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1D9E75]">ChronoEat</h1>
          <p className="text-neutral-400 text-sm mt-1">Питание по циркадным ритмам</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-neutral-900 border border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-100">Войти</h2>

          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="test@chronoeat.app"
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#1D9E75]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#1D9E75]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#1D9E75] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#17866300] transition-colors disabled:opacity-50"
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>

          <p className="text-center text-xs text-neutral-500">
            Демо: test@chronoeat.app / test1234
          </p>
        </form>
      </div>
    </div>
  )
}
