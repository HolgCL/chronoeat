'use client'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function SignOutButton({ mobile }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-neutral-500 hover:text-red-400 transition-colors"
      >
        <LogOut size={20} />
        Выйти
      </button>
    )
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition-colors w-full"
    >
      <LogOut size={16} />
      Выйти
    </button>
  )
}
