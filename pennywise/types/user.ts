import type { Insert, Tables } from './database'

export type UserRow = Tables<'users'>
export type UserInsert = Insert<'users'>

export type UserProfile = UserRow & {
  current_streak: number
}
