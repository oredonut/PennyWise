/**
 * Canonical database types for `public` tables (mirrors `001_initial_schema.sql`).
 * PostgREST returns `numeric` as string; `date` as `YYYY-MM-DD` string.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          monthly_income: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          monthly_income?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          monthly_income?: string | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          monthly_budget: string
          color: string | null
          is_custom: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          monthly_budget: string
          color?: string | null
          is_custom?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          monthly_budget?: string
          color?: string | null
          is_custom?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          amount: string
          note: string | null
          source: string | null
          merchant_raw: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          amount: string
          note?: string | null
          source?: string | null
          merchant_raw?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          amount?: string
          note?: string | null
          source?: string | null
          merchant_raw?: string | null
          created_at?: string
        }
      }
      recurring_rules: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: string
          note: string | null
          frequency: string | null
          next_fire_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: string
          note?: string | null
          frequency?: string | null
          next_fire_at: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: string
          note?: string | null
          frequency?: string | null
          next_fire_at?: string
        }
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          discipline_score: string | null
          total_spent: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          discipline_score?: string | null
          total_spent?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          discipline_score?: string | null
          total_spent?: string | null
        }
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_logged_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_logged_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_logged_at?: string | null
        }
      }
      merchant_map: {
        Row: {
          id: string
          user_id: string
          merchant_keyword: string
          category_id: string
        }
        Insert: {
          id?: string
          user_id: string
          merchant_keyword: string
          category_id: string
        }
        Update: {
          id?: string
          user_id?: string
          merchant_keyword?: string
          category_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type PublicTableName = keyof Database['public']['Tables']

/** Row shape for a table in `public` (Supabase `Tables<'name'>['Row']` pattern). */
export type Tables<T extends PublicTableName> = Database['public']['Tables'][T]['Row']

/** Insert shape for a table in `public`. */
export type Insert<T extends PublicTableName> = Database['public']['Tables'][T]['Insert']

/** Update shape for a table in `public`. */
export type Update<T extends PublicTableName> = Database['public']['Tables'][T]['Update']

/** Alias: same as `Tables<T>` / row type (common shorthand). */
export type Row<T extends PublicTableName> = Tables<T>
