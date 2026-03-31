import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AppNav from '@/components/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-neutral-950">
      <AppNav email={session.user.email ?? ''} />

      {/* Main */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
