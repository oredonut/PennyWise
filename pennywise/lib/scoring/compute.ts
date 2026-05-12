export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

interface Category {
  spent: number
  budget: number
}

interface ScoreInput {
  totalSpent: number
  totalBudget: number
  streakDays: number
  categories: Category[]
}

export function computeDisciplineScore({
  totalSpent,
  totalBudget,
  streakDays,
  categories,
}: ScoreInput): number {
  const baseScore = clamp((1 - totalSpent / totalBudget) * 100, 0, 100)
  const streakMultiplier = 1 + Math.log(streakDays + 1) * 0.1
  const catConsistency =
    categories.length === 0
      ? 1
      : categories.filter((c) => c.spent < c.budget).length / categories.length
  return clamp(baseScore * streakMultiplier * catConsistency, 0, 100)
}

export function computeBrokeScore(disciplineScore: number): number {
  return 100 - disciplineScore
}
