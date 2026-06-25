import { createClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../../../types/database.ts'
// SINGLE SOURCE OF TRUTH — the same discipline-score math the live recompute path
// (lib/scoring/recompute.ts) uses. Do NOT reimplement the formula here.
import { computeDisciplineScore } from '../_shared/scoring.ts'

type CategoryRow = {
  id: string
  monthly_budget: string
}

type TransactionRow = {
  category_id: string | null
  amount: string
  created_at: string
}

type StreakRow = {
  current_streak: number
  longest_streak: number
  last_logged_at: string | null
}

type UserRow = {
  id: string
}

function getUtcDateKey(reference = new Date()): string {
  return reference.toISOString().slice(0, 10)
}

function getLastLoggedDate(value: string | null): string | null {
  return value ? value.slice(0, 10) : null
}

function dayDifference(leftIsoDate: string, rightIsoDate: string): number {
  const left = new Date(`${leftIsoDate}T00:00:00.000Z`).getTime()
  const right = new Date(`${rightIsoDate}T00:00:00.000Z`).getTime()
  return Math.round((right - left) / 86_400_000)
}

function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

Deno.serve(async () => {
  const errors: string[] = []
  let processed = 0

  try {
    const supabase = createServiceClient()
    const now = new Date()
    // Mirror lib/scoring/recompute.ts exactly: calendar-month window keyed on the
    // UTC date, lower bound only, using created_at.
    const today = getUtcDateKey(now)
    const monthStart = `${today.slice(0, 7)}-01T00:00:00Z`

    const { data: users, error: usersError } = await supabase.from('users').select('id')
    if (usersError) {
      throw new Error(usersError.message)
    }

    const typedUsers = (users ?? []) as UserRow[]

    for (const user of typedUsers) {
      try {
        const [categoriesResult, transactionsResult, streakResult, todayLogResult] = await Promise.all([
          supabase
            .from('categories')
            .select('id, monthly_budget')
            .eq('user_id', user.id),
          supabase
            .from('transactions')
            .select('category_id, amount, created_at')
            .eq('user_id', user.id)
            .gte('created_at', monthStart),
          supabase
            .from('streaks')
            .select('current_streak, longest_streak, last_logged_at')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('daily_logs')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle(),
        ])

        if (categoriesResult.error) throw new Error(categoriesResult.error.message)
        if (transactionsResult.error) throw new Error(transactionsResult.error.message)
        if (streakResult.error) throw new Error(streakResult.error.message)
        if (todayLogResult.error) throw new Error(todayLogResult.error.message)

        // ── Spend aggregation (this month) — identical to recompute.ts ──
        const spentByCategory = new Map<string, number>()
        let totalSpent = 0
        let todayHasTransactions = false
        for (const transaction of transactionsResult.data ?? []) {
          const typedTransaction = transaction as TransactionRow
          const amount = parseFloat(typedTransaction.amount)
          if (!Number.isFinite(amount)) continue
          totalSpent += amount
          if (typedTransaction.category_id) {
            spentByCategory.set(
              typedTransaction.category_id,
              (spentByCategory.get(typedTransaction.category_id) ?? 0) + amount
            )
          }
          if (getUtcDateKey(new Date(typedTransaction.created_at)) === today) {
            todayHasTransactions = true
          }
        }

        // ── Discipline score (needs budgets; null when there are none) ──
        const catList = (categoriesResult.data ?? []) as CategoryRow[]
        const previousStreak = (streakResult.data ?? {
          current_streak: 0,
          longest_streak: 0,
          last_logged_at: null,
        }) as StreakRow

        const totalBudget = catList.reduce((sum, c) => sum + parseFloat(c.monthly_budget), 0)
        let score: number | null = null
        if (catList.length > 0 && totalBudget > 0) {
          score = Math.round(
            computeDisciplineScore({
              totalSpent,
              totalBudget,
              streakDays: previousStreak.current_streak ?? 0,
              categories: catList.map((c) => ({
                spent: spentByCategory.get(c.id) ?? 0,
                budget: parseFloat(c.monthly_budget),
              })),
            })
          )
        }

        const { error: logUpsertError } = await supabase
          .from('daily_logs')
          .upsert(
            {
              user_id: user.id,
              date: today,
              discipline_score: score == null ? null : String(score),
              total_spent: String(totalSpent),
            },
            { onConflict: 'user_id,date' }
          )
        if (logUpsertError) throw new Error(logUpsertError.message)

        // ── Streak transition ──
        // KEEP-IN-SYNC with lib/scoring/recompute.ts: the live POST
        // /api/transactions path runs this exact streak transition inline.
        let currentStreak = previousStreak.current_streak
        let longestStreak = previousStreak.longest_streak
        const lastLoggedDate = getLastLoggedDate(previousStreak.last_logged_at)

        if (todayHasTransactions && !todayLogResult.data) {
          if (lastLoggedDate && dayDifference(lastLoggedDate, today) === 1) {
            currentStreak += 1
          } else {
            currentStreak = 1
          }

          longestStreak = Math.max(longestStreak, currentStreak)
          const { error: streakUpsertError } = await supabase.from('streaks').upsert(
            {
              user_id: user.id,
              current_streak: currentStreak,
              longest_streak: longestStreak,
              last_logged_at: now.toISOString(),
            },
            { onConflict: 'user_id' }
          )
          if (streakUpsertError) throw new Error(streakUpsertError.message)
        } else if (lastLoggedDate && dayDifference(lastLoggedDate, today) > 1) {
          const { error: streakResetError } = await supabase.from('streaks').upsert(
            {
              user_id: user.id,
              current_streak: 0,
              longest_streak: longestStreak,
              last_logged_at: previousStreak.last_logged_at,
            },
            { onConflict: 'user_id' }
          )
          if (streakResetError) throw new Error(streakResetError.message)
        }

        processed += 1
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    return new Response(JSON.stringify({ processed, errors }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return new Response(JSON.stringify({ processed, errors }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    })
  }
})
