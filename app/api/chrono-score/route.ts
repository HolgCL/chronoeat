import { NextRequest, NextResponse } from 'next/server'
import { computeChronoScore } from '@/lib/chrono'
import type { Chronotype, MealType } from '@/lib/chrono'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const hour       = parseFloat(searchParams.get('hour')      ?? '12')
  const chronotype = (searchParams.get('chronotype') ?? 'intermediate') as Chronotype
  const mealType   = (searchParams.get('mealType')   ?? 'lunch')        as MealType

  const score = computeChronoScore(hour, chronotype, mealType)
  return NextResponse.json(score)
}
