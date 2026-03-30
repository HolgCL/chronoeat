import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { chronotype: true, calorieGoal: true, wakeUpTime: true, sleepTime: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { chronotype, calorieGoal } = body

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(chronotype !== undefined && { chronotype }),
      ...(calorieGoal !== undefined && { calorieGoal: Number(calorieGoal) }),
    },
    select: { chronotype: true, calorieGoal: true },
  })
  return NextResponse.json(user)
}
