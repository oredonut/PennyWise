import type { Insert, Tables } from './database'

export type CategoryRow = Tables<'categories'>
export type CategoryInsert = Insert<'categories'>

export type BudgetProgress = CategoryRow & {
  spent: number
  remaining: number
  percentage: number
}
