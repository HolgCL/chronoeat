import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { computeChronoScore } from '@/lib/chrono'
import type { Chronotype, MealType } from '@/lib/chrono'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dateParam = req.nextUrl.searchParams.get('date')
  const tz = parseInt(req.nextUrl.searchParams.get('tz') ?? '0') // getTimezoneOffset() value: UTC+3 = -180
  let start: Date, end: Date
  if (dateParam) {
    const [year, month, day] = dateParam.split('-').map(Number)
    start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) + tz * 60 * 1000)
    end   = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) + tz * 60 * 1000)
  } else {
    const now = new Date()
    start = startOfDay(now)
    end   = endOfDay(now)
  }
  const meals = await prisma.meal.findMany({
    where: {
      userId: session.user.id,
      loggedAt: { gte: start, lte: end },
    },
    orderBy: { loggedAt: 'asc' },
  })

  return NextResponse.json(meals)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    mealType: MealType
    loggedAt?: string
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const loggedAt = body.loggedAt ? new Date(body.loggedAt) : new Date()
  const hour = loggedAt.getHours() + loggedAt.getMinutes() / 60

  const chrono = computeChronoScore(hour, user.chronotype as Chronotype, body.mealType)

  const meal = await prisma.meal.create({
    data: {
      userId:     user.id,
      name:       body.name,
      calories:   body.calories,
      protein:    body.protein,
      carbs:      body.carbs,
      fat:        body.fat,
      mealType:   body.mealType,
      loggedAt,
      chronoScore: chrono.score,
      chronoZone:  chrono.zone,
      chronoTip:   chrono.tip,
    },
  })

  return NextResponse.json(meal, { status: 201 })
}
