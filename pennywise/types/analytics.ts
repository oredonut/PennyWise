export type MonthlyCategoryBreakdown = {
  category_id: string
  category_name: string
  spent: number
  budget: number
}

export type MonthlyAnalytics = {
  total_spent: number
  total_budget: number
  breakdown: MonthlyCategoryBreakdown[]
  discipline_score: number[]
  month_over_month_delta: number
}
