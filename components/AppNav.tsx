'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calculator, Settings } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { useAppStore, t } from '@/store/useAppStore'

export default function AppNav({ email }: { email: string }) {
  const { lang } = useAppStore()
  const tr = t[lang]
  const pathname = usePathname()

  const NAV = [
    { href: '/dashboard',  icon: LayoutDashboard, label: tr.nav.today },
    { href: '/calculator', icon: Calculator,       label: tr.nav.calc },
    { href: '/settings',   icon: Settings,         label: tr.nav.settings },
  ]

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-56 flex-col border-r border-neutral-800 p-4">
        <div className="mb-8 px-2">
          <h1 className="text-lg font-bold text-[#1D9E75]">ChronoEat</h1>
          <p className="text-xs text-neutral-500">{email}</p>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href} href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === href
                  ? 'bg-neutral-800 text-neutral-100'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
              }`}
            >
              <Icon size={16} />{label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition-colors w-full mt-2"
        >
          <LogOut size={16} />
          {tr.settings.signOut}
        </button>
      </aside>

      {/* Bottom nav — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-neutral-800 bg-neutral-950 md:hidden z-40">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href} href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
              pathname === href ? 'text-[#1D9E75]' : 'text-neutral-500 hover:text-neutral-100'
            }`}
          >
            <Icon size={20} />{label}
          </Link>
        ))}
      </nav>
    </>
  )
}
