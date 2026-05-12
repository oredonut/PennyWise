import type { Insert, Tables } from './database'

export type TransactionRow = Tables<'transactions'>
export type TransactionInsert = Insert<'transactions'>

export type TransactionWithCategory = TransactionRow & {
  category_name: string | null
  category_color: string | null
}
