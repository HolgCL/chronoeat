import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

const USER_SELECT = {
  chronotype: true, calorieGoal: true, proteinGoal: true,
  wakeUpTime: true, sleepTime: true,
  gender: true, age: true, weight: true, height: true, dailySteps: true,
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: USER_SELECT })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { chronotype, calorieGoal, proteinGoal, wakeUpTime, sleepTime, gender, age, weight, height, dailySteps } = body

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(chronotype  !== undefined && { chronotype }),
      ...(calorieGoal !== undefined && { calorieGoal: Number(calorieGoal) }),
      ...(proteinGoal !== undefined && { proteinGoal: Number(proteinGoal) }),
      ...(wakeUpTime  !== undefined && { wakeUpTime:  Number(wakeUpTime) }),
      ...(sleepTime   !== undefined && { sleepTime:   Number(sleepTime) }),
      ...(gender      !== undefined && { gender }),
      ...(age         !== undefined && { age:         Number(age) }),
      ...(weight      !== undefined && { weight:      Number(weight) }),
      ...(height      !== undefined && { height:      Number(height) }),
      ...(dailySteps  !== undefined && { dailySteps:  Number(dailySteps) }),
    },
    select: USER_SELECT,
  })
  return NextResponse.json(user)
}
