import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { subDays } from 'date-fns'

const client = new Anthropic()
const TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Check DB-persisted cache
  if (user.aiAdviceCache && user.aiAdviceCachedAt) {
    const age = Date.now() - new Date(user.aiAdviceCachedAt).getTime()
    if (age < TTL_MS) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(user.aiAdviceCache!))
          controller.close()
        },
      })
      return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }
  }

  const meals = await prisma.meal.findMany({
    where: { userId, loggedAt: { gte: subDays(new Date(), 7) } },
    orderBy: { loggedAt: 'desc' },
    take: 30,
  })

  const avgScore = meals.length
    ? Math.round(meals.reduce((s, m) => s + m.chronoScore, 0) / meals.length)
    : 0

  const mealSummary = meals.slice(0, 10).map(m =>
    `${m.name} (${m.mealType}, ${m.chronoScore}/100, ${new Date(m.loggedAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })})`
  ).join('\n')

  const userContext = `
Хронотип: ${user.chronotype}
Средний хроно-балл за неделю: ${avgScore}/100
Цель по калориям: ${user.calorieGoal} ккал/день
Последние приёмы пищи:
${mealSummary || 'Нет данных'}
`.trim()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = ''
        const response = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: `Ты персональный нутрициолог-хронобиолог. У тебя есть данные о приёмах пищи пользователя за последние 7 дней с их хроно-оценками. Дай 2-3 конкретных совета на сегодня. Будь кратким (макс 3 предложения на совет). Говори как друг, не как врач. На русском языке.`,
          messages: [{ role: 'user', content: userContext }],
        })

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }

        await prisma.user.update({
          where: { id: userId },
          data: { aiAdviceCache: fullText, aiAdviceCachedAt: new Date() },
        })

        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
