import { computeDisciplineScore, computeBrokeScore } from './compute'
import { sendPush } from '@/lib/push'
import type { createClient } from '@/lib/supabase/server'

type DbClient = Awaited<ReturnType<typeof createClient>>

export type RecomputeResult = {
  score: number | null
  brokeScore: number | null
  streak: number | null
}

// ── UTC day-key helpers — mirror compute-daily-score/index.ts ──
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

/**
 * Recompute today's discipline score, upsert the daily log, and advance the
 * streak — the live half of the score loop that POST /api/transactions awaits
 * so it can return the fresh numbers to the client. The 23:55 cron
 * (supabase/functions/compute-daily-score) performs the identical transition
 * for every user nightly.
 *
 * Pass the amounts just added per category (keyed by category id) so we can
 * detect a category crossing the 75% budget threshold on THIS write and fire a
 * one-time push alert.
 */
export async function recomputeTodayScore(
  supabase: DbClient,
  userId: string,
  addedByCategory: Record<string, number> = {},
): Promise<RecomputeResult> {
  const now = new Date()
  const today = getUtcDateKey(now)
  const monthStart = `${today.slice(0, 7)}-01T00:00:00Z`

  // todayLog is read BEFORE we upsert below, so it reflects whether today's log
  // already existed — that gates the once-per-day streak bump.
  const [{ data: cats }, { data: txns }, { data: streak }, { data: todayLog }] =
    await Promise.all([
      supabase.from('categories').select('id, name, monthly_budget').eq('user_id', userId),
      supabase
        .from('transactions')
        .select('category_id, amount, created_at')
        .eq('user_id', userId)
        .gte('created_at', monthStart),
      supabase
        .from('streaks')
        .select('current_streak, longest_streak, last_logged_at')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle(),
    ])

  // ── Spend aggregation (this month) ───────────────────────────
  const spentByCategory = new Map<string, number>()
  let totalSpent = 0
  let todayHasTransactions = false
  for (const txn of txns ?? []) {
    const amount = parseFloat(txn.amount)
    if (!Number.isFinite(amount)) continue
    totalSpent += amount
    if (txn.category_id) {
      spentByCategory.set(txn.category_id, (spentByCategory.get(txn.category_id) ?? 0) + amount)
    }
    if (getUtcDateKey(new Date(txn.created_at)) === today) todayHasTransactions = true
  }

  // ── Discipline score (needs budgets; null when there are none) ──
  const catList = cats ?? []
  const totalBudget = catList.reduce((sum, c) => sum + parseFloat(c.monthly_budget), 0)
  let score: number | null = null
  if (catList.length > 0 && totalBudget > 0) {
    score = Math.round(
      computeDisciplineScore({
        totalSpent,
        totalBudget,
        streakDays: streak?.current_streak ?? 0,
        categories: catList.map((c) => ({
          spent: spentByCategory.get(c.id) ?? 0,
          budget: parseFloat(c.monthly_budget),
        })),
      }),
    )
  }

  await supabase.from('daily_logs').upsert(
    {
      user_id: userId,
      date: today,
      discipline_score: score == null ? null : String(score),
      total_spent: String(totalSpent),
    },
    { onConflict: 'user_id,date' },
  )

  // ── Streak transition ────────────────────────────────────────
  // KEEP-IN-SYNC with supabase/functions/compute-daily-score/index.ts: the
  // nightly cron runs this exact transition for every user. If the two drift,
  // a streak will flip-flop between the live write and the 23:55 recompute.
  const prev = streak ?? { current_streak: 0, longest_streak: 0, last_logged_at: null }
  let currentStreak = prev.current_streak
  let longestStreak = prev.longest_streak
  const lastLoggedDate = getLastLoggedDate(prev.last_logged_at)

  if (todayHasTransactions && !todayLog) {
    // First log of the day: extend the streak if yesterday was logged, else
    // restart at 1 (today still counts).
    if (lastLoggedDate && dayDifference(lastLoggedDate, today) === 1) {
      currentStreak += 1
    } else {
      currentStreak = 1
    }
    longestStreak = Math.max(longestStreak, currentStreak)
    await supabase.from('streaks').upsert(
      {
        user_id: userId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_logged_at: now.toISOString(),
      },
      { onConflict: 'user_id' },
    )
  } else if (lastLoggedDate && dayDifference(lastLoggedDate, today) > 1) {
    // A gap opened since the last logged day — reset, keep the record.
    currentStreak = 0
    await supabase.from('streaks').upsert(
      {
        user_id: userId,
        current_streak: 0,
        longest_streak: longestStreak,
        last_logged_at: prev.last_logged_at,
      },
      { onConflict: 'user_id' },
    )
  }

  // ── Budget alert: notify when a category crosses 75% on this write ──
  // Best-effort — an alert failure must never affect the score recompute.
  try {
    const crossed = catList.filter((c) => {
      const budget = parseFloat(c.monthly_budget)
      if (!(budget > 0)) return false
      const newSpent = spentByCategory.get(c.id) ?? 0
      const oldSpent = newSpent - (addedByCategory[c.id] ?? 0)
      const newPct = (newSpent / budget) * 100
      const oldPct = (oldSpent / budget) * 100
      return newPct >= 75 && newPct < 100 && oldPct < 75
    })

    if (crossed.length > 0) {
      const { data: userRow } = await supabase
        .from('users')
        .select('push_token')
        .eq('id', userId)
        .maybeSingle()
      const token = userRow?.push_token
      if (token) {
        for (const c of crossed) {
          await sendPush(
            token,
            'Budget alert 🚨',
            `You've used 75% of your ${c.name} budget`,
            { route: 'Insights' },
          )
        }
      }
    }
  } catch {
    // ignore — alerts are best-effort
  }

  return {
    score,
    brokeScore: score == null ? null : computeBrokeScore(score),
    streak: currentStreak,
  }
}
