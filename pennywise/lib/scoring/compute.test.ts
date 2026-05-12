import { describe, it, expect } from 'vitest'
import { clamp, computeDisciplineScore, computeBrokeScore } from './compute'

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(50, 0, 100)).toBe(50)
  })

  it('clamps to min when below range', () => {
    expect(clamp(-10, 0, 100)).toBe(0)
  })

  it('clamps to max when above range', () => {
    expect(clamp(150, 0, 100)).toBe(100)
  })

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 100)).toBe(0)
  })

  it('returns max when value equals max', () => {
    expect(clamp(100, 0, 100)).toBe(100)
  })
})

describe('computeDisciplineScore', () => {
  it('returns 100 when nothing is spent and all categories under budget', () => {
    const score = computeDisciplineScore({
      totalSpent: 0,
      totalBudget: 10000,
      streakDays: 0,
      categories: [{ spent: 0, budget: 500 }],
    })
    // base_score = clamp((1 - 0/10000)*100, 0, 100) = 100
    // streak_multiplier = 1 + log(1)*0.1 = 1
    // cat_consistency = 1
    // final = 100 * 1 * 1 = 100
    expect(score).toBe(100)
  })

  it('applies streak multiplier correctly for non-zero streak', () => {
    const score = computeDisciplineScore({
      totalSpent: 0,
      totalBudget: 10000,
      streakDays: 9,
      categories: [{ spent: 0, budget: 500 }],
    })
    // base_score = 100
    // streak_multiplier = 1 + log(10)*0.1 ≈ 1.2303
    // cat_consistency = 1
    // final = 100 * 1.2303 ≈ 123.03 → clamped to 100
    expect(score).toBe(100)
  })

  it('reduces score proportionally to spend ratio', () => {
    const score = computeDisciplineScore({
      totalSpent: 5000,
      totalBudget: 10000,
      streakDays: 0,
      categories: [{ spent: 0, budget: 500 }],
    })
    // base_score = clamp((1 - 0.5)*100, 0, 100) = 50
    // streak_multiplier = 1
    // cat_consistency = 1
    // final = 50
    expect(score).toBeCloseTo(50, 5)
  })

  it('reduces score when category is over budget', () => {
    const score = computeDisciplineScore({
      totalSpent: 0,
      totalBudget: 10000,
      streakDays: 0,
      categories: [
        { spent: 600, budget: 500 }, // over budget
        { spent: 200, budget: 500 }, // under budget
      ],
    })
    // base_score = 100
    // streak_multiplier = 1
    // cat_consistency = 1/2 = 0.5
    // final = 100 * 1 * 0.5 = 50
    expect(score).toBeCloseTo(50, 5)
  })

  it('returns 0 when total spent exceeds total budget', () => {
    const score = computeDisciplineScore({
      totalSpent: 15000,
      totalBudget: 10000,
      streakDays: 0,
      categories: [{ spent: 600, budget: 500 }],
    })
    // base_score = clamp((1 - 1.5)*100, 0, 100) = 0
    // final = 0
    expect(score).toBe(0)
  })

  it('returns 0 when no categories are under budget', () => {
    const score = computeDisciplineScore({
      totalSpent: 0,
      totalBudget: 10000,
      streakDays: 0,
      categories: [
        { spent: 600, budget: 500 },
        { spent: 400, budget: 300 },
      ],
    })
    // cat_consistency = 0
    // final = anything * 0 = 0
    expect(score).toBe(0)
  })

  it('clamps final score to [0, 100]', () => {
    const score = computeDisciplineScore({
      totalSpent: 0,
      totalBudget: 10000,
      streakDays: 100,
      categories: [{ spent: 0, budget: 500 }],
    })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('combines all factors in a mixed scenario', () => {
    const score = computeDisciplineScore({
      totalSpent: 3000,
      totalBudget: 10000,
      streakDays: 9,
      categories: [
        { spent: 200, budget: 500 }, // under
        { spent: 600, budget: 500 }, // over
      ],
    })
    const baseScore = (1 - 3000 / 10000) * 100  // 70
    const streakMultiplier = 1 + Math.log(10) * 0.1
    const catConsistency = 0.5
    const expected = Math.min(100, Math.max(0, baseScore * streakMultiplier * catConsistency))
    expect(score).toBeCloseTo(expected, 5)
  })
})

describe('computeBrokeScore', () => {
  it('returns 100 minus discipline score', () => {
    expect(computeBrokeScore(70)).toBe(30)
  })

  it('returns 100 when discipline score is 0', () => {
    expect(computeBrokeScore(0)).toBe(100)
  })

  it('returns 0 when discipline score is 100', () => {
    expect(computeBrokeScore(100)).toBe(0)
  })
})
