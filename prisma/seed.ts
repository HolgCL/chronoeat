import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { subDays, setHours, setMinutes } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('test1234', 10)

  const user = await prisma.user.upsert({
    where: { email: 'test@chronoeat.app' },
    update: {},
    create: {
      email: 'test@chronoeat.app',
      name: 'Test User',
      password: hashed,
      chronotype: 'intermediate',
      wakeUpTime: 7.0,
      sleepTime: 23.0,
      calorieGoal: 2000,
      proteinGoal: 150,
    },
  })

  const existingMeals = await prisma.meal.count({ where: { userId: user.id } })
  if (existingMeals > 0) {
    console.log('✓ Seed skipped — data already exists')
    return
  }

  const seedMeals = [
    // Today
    { name: 'Овсянка с бананом', cal: 380, p: 12, c: 68, f: 8, type: 'breakfast', hour: 8, min: 15, score: 82, zone: 'green', tip: 'Отличное время — инсулин на пике, углеводы утилизируются хорошо', daysAgo: 0 },
    { name: 'Куриный суп', cal: 320, p: 28, c: 24, f: 8, type: 'lunch', hour: 13, min: 0, score: 76, zone: 'green', tip: 'Оптимальное окно питания. Белок усваивается максимально', daysAgo: 0 },
    { name: 'Творог с ягодами', cal: 180, p: 22, c: 14, f: 3, type: 'snack', hour: 16, min: 30, score: 61, zone: 'yellow', tip: 'Допустимо. Выбирай белковые продукты ближе к вечеру', daysAgo: 0 },
    { name: 'Гречка с лососем', cal: 520, p: 38, c: 44, f: 16, type: 'dinner', hour: 19, min: 30, score: 44, zone: 'yellow', tip: 'Поздний ужин. Предпочти белок и овощи вместо углеводов', daysAgo: 0 },
    // Yesterday
    { name: 'Яичница с тостом', cal: 420, p: 18, c: 32, f: 22, type: 'breakfast', hour: 7, min: 45, score: 88, zone: 'green', tip: 'Прекрасное начало дня — кортизол помогает усвоению', daysAgo: 1 },
    { name: 'Цезарь с курицей', cal: 480, p: 32, c: 18, f: 28, type: 'lunch', hour: 12, min: 30, score: 79, zone: 'green', tip: 'Пик метаболической активности. Хороший выбор!', daysAgo: 1 },
    { name: 'Пицца', cal: 680, p: 24, c: 78, f: 28, type: 'dinner', hour: 21, min: 0, score: 22, zone: 'red', tip: 'Слишком поздно. Мелатонин подавляет переработку углеводов', daysAgo: 1 },
    // 2 days ago
    { name: 'Смузи', cal: 290, p: 8, c: 52, f: 6, type: 'breakfast', hour: 9, min: 0, score: 74, zone: 'green', tip: 'Хорошее время для углеводов', daysAgo: 2 },
    { name: 'Борщ', cal: 350, p: 16, c: 38, f: 12, type: 'lunch', hour: 14, min: 0, score: 71, zone: 'green', tip: 'В пределах оптимального окна', daysAgo: 2 },
    { name: 'Протеиновый батончик', cal: 220, p: 20, c: 24, f: 6, type: 'snack', hour: 17, min: 0, score: 58, zone: 'yellow', tip: 'Допустимо — хорошо что выбрал белок', daysAgo: 2 },
  ]

  for (const m of seedMeals) {
    const date = subDays(new Date(), m.daysAgo)
    const loggedAt = setMinutes(setHours(date, m.hour), m.min)
    await prisma.meal.create({
      data: {
        userId: user.id,
        name: m.name,
        calories: m.cal,
        protein: m.p,
        carbs: m.c,
        fat: m.f,
        mealType: m.type,
        loggedAt,
        chronoScore: m.score,
        chronoZone: m.zone,
        chronoTip: m.tip,
      },
    })
  }

  // ChronoLog summaries
  for (let d = 0; d < 3; d++) {
    const date = subDays(new Date(), d)
    await prisma.chronoLog.upsert({
      where: { id: `seed-log-${d}` },
      update: {},
      create: {
        id: `seed-log-${d}`,
        userId: user.id,
        date,
        avgChronoScore: d === 0 ? 65.7 : d === 1 ? 63.0 : 67.7,
        eatingWindowH: d === 0 ? 11.25 : d === 1 ? 13.25 : 8.0,
        firstMealHour: d === 0 ? 8.25 : d === 1 ? 7.75 : 9.0,
        lastMealHour: d === 0 ? 19.5 : d === 1 ? 21.0 : 17.0,
      },
    })
  }

  console.log('✓ Seed complete — test@chronoeat.app / test1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
