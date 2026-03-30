import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { computeChronoScore } from '@/lib/chrono'
import type { Chronotype, MealType } from '@/lib/chrono'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meal = await prisma.meal.findUnique({ where: { id: params.id } })
  if (!meal || meal.userId !== session.user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.meal.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meal = await prisma.meal.findUnique({ where: { id: params.id } })
  if (!meal || meal.userId !== session.user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as {
    name: string; calories: number; protein: number; carbs: number;
    fat: number; mealType: MealType; loggedAt: string
  }

  const loggedAt = new Date(body.loggedAt)
  const hour = loggedAt.getHours() + loggedAt.getMinutes() / 60
  const chrono = computeChronoScore(hour, user.chronotype as Chronotype, body.mealType)

  const updated = await prisma.meal.update({
    where: { id: params.id },
    data: {
      name:        body.name,
      calories:    body.calories,
      protein:     body.protein,
      carbs:       body.carbs,
      fat:         body.fat,
      mealType:    body.mealType,
      loggedAt,
      chronoScore: chrono.score,
      chronoZone:  chrono.zone,
      chronoTip:   chrono.tip,
    },
  })

  return NextResponse.json(updated)
}
