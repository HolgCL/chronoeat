import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'
import { LayoutDashboard, Calculator, Settings } from 'lucide-react'

const NAV = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Сегодня' },
  { href: '/calculator',  icon: Calculator,      label: 'КБЖУ' },
  { href: '/settings',    icon: Settings,        label: 'Настройки' },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-neutral-950">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-56 flex-col border-r border-neutral-800 p-4">
        <div className="mb-8 px-2">
          <h1 className="text-lg font-bold text-[#1D9E75]">ChronoEat</h1>
          <p className="text-xs text-neutral-500">{session.user.email}</p>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href} href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
            >
              <Icon size={16} />{label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-neutral-800 bg-neutral-950 md:hidden">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href} href={href}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            <Icon size={20} />{label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
