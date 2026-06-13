import { createClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../../../types/database.ts'

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getUtcDateKey(reference = new Date()): string {
  return reference.toISOString().slice(0, 10)
}

function getUtcMonthRange(reference = new Date()) {
  const year = reference.getUTCFullYear()
  const month = reference.getUTCMonth()
  const start = new Date(Date.UTC(year, month, 1))
  const end = new Date(Date.UTC(year, month + 1, 1))
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    daysElapsed: clamp(reference.getUTCDate(), 1, daysInMonth),
    daysInMonth,
    todayIsoDate: getUtcDateKey(reference),
  }
}

function toFiniteNumber(value: string | number | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * KEEP-IN-SYNC with `lib/score.ts`.
 */
function computeDisciplineScore(
  categories: Array<{ monthly_budget: number; spent_this_month: number }>,
  daysElapsed: number,
  daysInMonth: number
): number {
  const safeDaysElapsed = clamp(Math.floor(Number.isFinite(daysElapsed) ? daysElapsed : 1), 1, Math.max(1, Math.floor(Number.isFinite(daysInMonth) ? daysInMonth : 1)))
  const safeDaysInMonth = Math.max(1, Math.floor(Number.isFinite(daysInMonth) ? daysInMonth : 1))

  const normalizedCategories = categories.map((category) => ({
    monthlyBudget: Math.max(0, Number.isFinite(category.monthly_budget) ? category.monthly_budget : 0),
    spentThisMonth: Math.max(0, Number.isFinite(category.spent_this_month) ? category.spent_this_month : 0),
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
    const today = new Date()
    const month = getUtcMonthRange(today)

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
            .gte('created_at', month.startIso)
            .lt('created_at', month.endIso),
          supabase
            .from('streaks')
            .select('current_streak, longest_streak, last_logged_at')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('daily_logs')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', month.todayIsoDate)
            .maybeSingle(),
        ])

        if (categoriesResult.error) throw new Error(categoriesResult.error.message)
        if (transactionsResult.error) throw new Error(transactionsResult.error.message)
        if (streakResult.error) throw new Error(streakResult.error.message)
        if (todayLogResult.error) throw new Error(todayLogResult.error.message)

        let totalSpent = 0
        const spentByCategory = new Map<string, number>()
        const todayHasTransactions = (transactionsResult.data ?? []).some((transaction) =>
          getUtcDateKey(new Date((transaction as TransactionRow).created_at)) === month.todayIsoDate
        )

        for (const transaction of transactionsResult.data ?? []) {
          const typedTransaction = transaction as TransactionRow
          const amount = toFiniteNumber(typedTransaction.amount)
          totalSpent += amount
          if (!typedTransaction.category_id) continue
          spentByCategory.set(
            typedTransaction.category_id,
            (spentByCategory.get(typedTransaction.category_id) ?? 0) + amount
          )
        }

        const scoreCategories = (categoriesResult.data ?? []).map((category) => {
          const typedCategory = category as CategoryRow
          return {
            monthly_budget: toFiniteNumber(typedCategory.monthly_budget),
            spent_this_month: spentByCategory.get(typedCategory.id) ?? 0,
          }
        })

        const disciplineScore = computeDisciplineScore(scoreCategories, month.daysElapsed, month.daysInMonth)

        const { error: logUpsertError } = await supabase
          .from('daily_logs')
          .upsert(
            {
              user_id: user.id,
              date: month.todayIsoDate,
              discipline_score: String(disciplineScore),
              total_spent: String(totalSpent),
            },
            { onConflict: 'user_id,date' }
          )
        if (logUpsertError) throw new Error(logUpsertError.message)

        const previousStreak = (streakResult.data ?? {
          current_streak: 0,
          longest_streak: 0,
          last_logged_at: null,
        }) as StreakRow

        let currentStreak = previousStreak.current_streak
        let longestStreak = previousStreak.longest_streak
        const lastLoggedDate = getLastLoggedDate(previousStreak.last_logged_at)

        if (todayHasTransactions && !todayLogResult.data) {
          if (lastLoggedDate && dayDifference(lastLoggedDate, month.todayIsoDate) === 1) {
            currentStreak += 1
          } else {
            currentStreak = currentStreak > 0 ? 1 : 1
          }

          longestStreak = Math.max(longestStreak, currentStreak)
          const { error: streakUpsertError } = await supabase.from('streaks').upsert(
            {
              user_id: user.id,
              current_streak: currentStreak,
              longest_streak: longestStreak,
              last_logged_at: today.toISOString(),
            },
            { onConflict: 'user_id' }
          )
          if (streakUpsertError) throw new Error(streakUpsertError.message)
        } else if (lastLoggedDate && dayDifference(lastLoggedDate, month.todayIsoDate) > 1) {
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
