import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { chronotype: true, calorieGoal: true, proteinGoal: true, wakeUpTime: true, sleepTime: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { chronotype, calorieGoal, proteinGoal } = body

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(chronotype !== undefined && { chronotype }),
      ...(calorieGoal !== undefined && { calorieGoal: Number(calorieGoal) }),
      ...(proteinGoal !== undefined && { proteinGoal: Number(proteinGoal) }),
    },
    select: { chronotype: true, calorieGoal: true, proteinGoal: true },
  })
  return NextResponse.json(user)
}
