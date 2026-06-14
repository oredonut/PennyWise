// ============================================================
// Shared score + streak recompute. Called after a transaction
// write (single or bulk) to refresh today's daily_logs row and
// the user's streak, returning the fresh figures for the API
// response. Throws on DB error — callers decide whether a
// recompute failure should affect their response (it must never
// fail the already-committed insert).
// ============================================================

import { computeDisciplineScore } from '@/lib/score'
import { getUtcMonthRange } from '@/lib/time'
import type { createClient } from '@/lib/supabase/server'

type DbClient = Awaited<ReturnType<typeof createClient>>

export type RecomputeResult = {
  score: number
  brokeScore: number
  streak: number
}

export async function recomputeScoreAndStreak(
  supabase: DbClient,
  userId: string,
  now: Date = new Date()
): Promise<RecomputeResult> {
  const { startIso, endIso, daysElapsed, daysInMonth, todayIsoDate } = getUtcMonthRange(now)

  const [categoriesResult, monthTxnsResult, streakResult] = await Promise.all([
    supabase.from('categories').select('id, monthly_budget').eq('user_id', userId),
    supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('user_id', userId)
      .gte('created_at', startIso)
      .lt('created_at', endIso),
    supabase
      .from('streaks')
      .select('current_streak, longest_streak, last_logged_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (categoriesResult.error) throw categoriesResult.error
  if (monthTxnsResult.error) throw monthTxnsResult.error
  if (streakResult.error) throw streakResult.error

  // Per-category spend for this month (same shape as the dashboard).
  const categoryRows = (categoriesResult.data ?? []) as Array<{ id: string; monthly_budget: string }>
  const spentByCategory = new Map<string, number>()
  let totalSpent = 0
  for (const t of (monthTxnsResult.data ?? []) as Array<{ amount: string; category_id: string | null }>) {
    const amount = Number(t.amount)
    if (!Number.isFinite(amount)) continue
    totalSpent += amount
    if (t.category_id) {
      spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + amount)
    }
  }

  const score = computeDisciplineScore(
    categoryRows.map((c) => ({
      monthly_budget: Number(c.monthly_budget),
      spent_this_month: spentByCategory.get(c.id) ?? 0,
    })),
    daysElapsed,
    daysInMonth
  )

  // Upsert today's daily log (merge on the user/date unique key).
  const { error: logError } = await supabase.from('daily_logs').upsert(
    {
      user_id: userId,
      date: todayIsoDate,
      discipline_score: String(score),
      total_spent: String(totalSpent),
    },
    { onConflict: 'user_id,date' }
  )
  if (logError) throw logError

  // ── Streak update ────────────────────────────────────────────
  const yesterdayIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)
  )
    .toISOString()
    .slice(0, 10)

  const existing = streakResult.data
  const currentStreak = existing?.current_streak ?? 0
  const longestStreak = existing?.longest_streak ?? 0
  const lastLoggedDate = existing?.last_logged_at
    ? new Date(existing.last_logged_at).toISOString().slice(0, 10)
    : null

  let streak = currentStreak
  if (lastLoggedDate === todayIsoDate) {
    // Already logged today — leave the streak untouched.
    streak = currentStreak
  } else {
    // Yesterday → continue the run; otherwise (older or first ever) → reset to 1.
    const nextStreak = lastLoggedDate === yesterdayIso ? currentStreak + 1 : 1
    const nextLongest = Math.max(longestStreak, nextStreak)
    const { error: streakError } = await supabase.from('streaks').upsert(
      {
        user_id: userId,
        current_streak: nextStreak,
        longest_streak: nextLongest,
        last_logged_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    if (streakError) throw streakError
    streak = nextStreak
  }

  return { score, brokeScore: 100 - score, streak }
}
