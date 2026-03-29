import { describe, it, expect } from 'vitest'
import {
  computeChronoScore,
  getCortisolLevel,
  getInsulinSensitivity,
  getMelatoninLevel,
  getEatingWindow,
  getMacroRecommendation,
} from '../chrono'

describe('getEatingWindow', () => {
  it('intermediate: 08–18', () => {
    const w = getEatingWindow('intermediate')
    expect(w.start).toBe(8)
    expect(w.end).toBe(18)
  })
  it('extreme_evening: 11–21', () => {
    const w = getEatingWindow('extreme_evening')
    expect(w.start).toBe(11)
    expect(w.end).toBe(21)
  })
  it('extreme_morning: 06–16', () => {
    const w = getEatingWindow('extreme_morning')
    expect(w.start).toBe(6)
    expect(w.end).toBe(16)
  })
})

describe('hormone curves — values in [0,1]', () => {
  const hours = [0, 4, 8, 12, 16, 20, 23]
  it('cortisol always in [0,1]', () => {
    hours.forEach(h => {
      expect(getCortisolLevel(h, 0)).toBeGreaterThanOrEqual(0)
      expect(getCortisolLevel(h, 0)).toBeLessThanOrEqual(1)
    })
  })
  it('insulin always in [0,1]', () => {
    hours.forEach(h => {
      expect(getInsulinSensitivity(h, 0)).toBeGreaterThanOrEqual(0)
      expect(getInsulinSensitivity(h, 0)).toBeLessThanOrEqual(1)
    })
  })
  it('melatonin always in [0,1]', () => {
    hours.forEach(h => {
      expect(getMelatoninLevel(h, 0)).toBeGreaterThanOrEqual(0)
      expect(getMelatoninLevel(h, 0)).toBeLessThanOrEqual(1)
    })
  })
})

describe('hormone peaks', () => {
  it('cortisol peaks in the morning', () => {
    const morning = getCortisolLevel(8, 0)
    const night   = getCortisolLevel(2, 0)
    expect(morning).toBeGreaterThan(night)
  })
  it('insulin highest midday', () => {
    const midday  = getInsulinSensitivity(12, 0)
    const night   = getInsulinSensitivity(2, 0)
    expect(midday).toBeGreaterThan(night)
  })
  it('melatonin low at noon', () => {
    expect(getMelatoninLevel(12, 0)).toBeLessThan(0.2)
  })
  it('melatonin high at night', () => {
    expect(getMelatoninLevel(2, 0)).toBeGreaterThan(0.5)
  })
})

describe('computeChronoScore', () => {
  it('breakfast at 8am → green zone', () => {
    const s = computeChronoScore(8, 'intermediate', 'breakfast')
    expect(s.zone).toBe('green')
    expect(s.score).toBeGreaterThanOrEqual(70)
  })
  it('dinner at 23:00 → red zone', () => {
    const s = computeChronoScore(23, 'intermediate', 'dinner')
    expect(s.zone).toBe('red')
    expect(s.score).toBeLessThan(40)
  })
  it('lunch at 13:00 intermediate → good score', () => {
    const s = computeChronoScore(13, 'intermediate', 'lunch')
    expect(s.score).toBeGreaterThanOrEqual(60)
  })
  it('evening chronotype: dinner at 19:30 → better than intermediate', () => {
    const evening      = computeChronoScore(19.5, 'evening', 'dinner')
    const intermediate = computeChronoScore(19.5, 'intermediate', 'dinner')
    expect(evening.score).toBeGreaterThanOrEqual(intermediate.score)
  })
  it('score always 0–100', () => {
    const cases: [number, Parameters<typeof computeChronoScore>[1], Parameters<typeof computeChronoScore>[2]][] = [
      [3, 'extreme_morning', 'snack'],
      [14, 'evening', 'lunch'],
      [22, 'extreme_evening', 'dinner'],
    ]
    cases.forEach(([h, c, m]) => {
      const { score } = computeChronoScore(h, c, m)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })
})

describe('getMacroRecommendation', () => {
  it('ratios sum to ~1', () => {
    const r = getMacroRecommendation(12, 'intermediate')
    const sum = r.carbRatio + r.proteinRatio + r.fatRatio
    expect(sum).toBeCloseTo(1, 1)
  })
  it('more carbs recommended midday than late night', () => {
    const midday = getMacroRecommendation(12, 'intermediate')
    const night  = getMacroRecommendation(23, 'intermediate')
    expect(midday.carbRatio).toBeGreaterThan(night.carbRatio)
  })
})
