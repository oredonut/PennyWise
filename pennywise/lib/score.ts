export interface DisciplineCategoryInput {
  monthly_budget: number
  spent_this_month: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toFiniteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0
}

/**
 * Compute a discipline score from monthly budgets and current-month spend.
 *
 * Formula:
 * - Each category receives a prorated budget: monthly_budget * daysElapsed / daysInMonth.
 * - If spend is within the prorated budget, the category gets full marks.
 * - If spend exceeds the prorated budget, the category score falls linearly by
 *   overspend ratio, capped at 0 for that category.
 * - Category scores are weighted by their share of total monthly budget.
 * - The final score is rounded to the nearest integer and clamped to 0-100.
 */
export function computeDisciplineScore(
  categories: DisciplineCategoryInput[],
  daysElapsed: number,
  daysInMonth: number
): number {
  const safeDaysElapsed = clamp(Math.floor(toFiniteNumber(daysElapsed)), 1, Math.max(1, Math.floor(toFiniteNumber(daysInMonth))))
  const safeDaysInMonth = Math.max(1, Math.floor(toFiniteNumber(daysInMonth)))

  const normalizedCategories = categories.map((category) => ({
    monthlyBudget: Math.max(0, toFiniteNumber(category.monthly_budget)),
    spentThisMonth: Math.max(0, toFiniteNumber(category.spent_this_month)),
  }))

  const totalBudget = normalizedCategories.reduce((sum, category) => sum + category.monthlyBudget, 0)
  if (totalBudget <= 0) {
    const hasSpend = normalizedCategories.some((category) => category.spentThisMonth > 0)
    return hasSpend ? 0 : 100
  }

  const weightedScore = normalizedCategories.reduce((sum, category) => {
    if (category.monthlyBudget <= 0) {
      return sum
    }

    const proratedBudget = (category.monthlyBudget * safeDaysElapsed) / safeDaysInMonth
    let categoryScore = 100

    if (category.spentThisMonth > proratedBudget) {
      const overspendBase = Math.max(proratedBudget, 1)
      const overspendRatio = (category.spentThisMonth - proratedBudget) / overspendBase
      categoryScore = clamp(100 - overspendRatio * 100, 0, 100)
    }

    const weight = category.monthlyBudget / totalBudget
    return sum + categoryScore * weight
  }, 0)

  return Math.round(clamp(weightedScore, 0, 100))
}

export function brokeScore(score: number): number {
  return 100 - score
}
