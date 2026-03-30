# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use `pnpm` as the package manager.

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run all unit tests (Vitest)

pnpm db:push      # Sync Prisma schema to SQLite DB
pnpm db:seed      # Seed the database (prisma/seed.ts)
```

To run a single test file:
```bash
pnpm vitest run lib/__tests__/chrono.test.ts
```

## Architecture

**ChronoEat** is a circadian rhythm-aware meal tracker built with Next.js 14 App Router, TypeScript, Prisma/SQLite, and NextAuth.js (credentials + JWT). The core value proposition is scoring each meal based on the user's circadian biology.

### Key layers

**Core algorithm — `lib/chrono.ts`**
This is the heart of the app. It models three hormone curves (cortisol, insulin sensitivity, melatonin) as sinusoidal functions offset by the user's chronotype, then produces a 0–100 chrono-score and zone (green/yellow/red) for any meal. All server-side scoring calls go through `computeChronoScore(hour, chronotype, mealType)`. The five chronotype offsets range from −2h (extreme morning) to +3h (extreme evening).

**API routes — `app/api/`**
- `POST /api/meals` — creates a meal, computes its chrono-score server-side, persists via Prisma
- `GET /api/meals?date=` — fetch meals for a date
- `GET /api/chrono-score` — stateless score calculator (no auth)
- `POST /api/ai-advice` — streams Claude AI nutrition tips (Anthropic SDK); 6-hour per-user cache based on last 7 days of meal data

**Auth — `auth.ts` + `middleware.ts`**
NextAuth.js with Prisma adapter. Credentials provider with bcryptjs. Middleware protects `/dashboard/:path*` and `/(app)/:path*`. Custom pages: `/login` (signIn), `/onboarding` (newUser).

**Client state — `store/useAppStore.ts`**
Zustand store manages today's meals and AI advice globally. Components read from the store; API calls write to it.

**Pages — `app/(app)/` and `app/(auth)/`**
Route groups: `(auth)` for login/onboarding, `(app)` for the authenticated shell (dashboard, log, analytics, settings).

### Database (Prisma + SQLite)

Three domain models:
- `User` — profile, chronotype, wakeUpTime/sleepTime, nutrition goals
- `Meal` — per-meal log with nutritional macros, loggedAt timestamp, and computed chronoScore/chronoZone/chronoTip
- `ChronoLog` — daily aggregated circadian stats (avgChronoScore, eatingWindowH, firstMealHour, lastMealHour)

### Environment variables

Required in `.env.local`:
- `DATABASE_URL` — SQLite file path (e.g. `file:./dev.db`)
- `NEXTAUTH_SECRET` — JWT secret
- `ANTHROPIC_API_KEY` — for AI advice endpoint

### Custom Tailwind colors

The `chrono` palette maps directly to zone semantics:
- `chrono-green` (#1D9E75) — optimal eating window (score ≥ 70)
- `chrono-yellow` (#BA7517) — acceptable (40–69)
- `chrono-red` (#E24B4A) — suboptimal (< 40)
- `chrono-amber` (#EF9F27), `chrono-violet` (#7F77DD) — accent/UI

### Testing

Unit tests live in `lib/__tests__/`. Current coverage is focused on `chrono.ts`: hormone curve bounds, zone classification at representative hours (8am breakfast → green, 11pm dinner → red), chronotype offset effects, and macro ratio sums.
