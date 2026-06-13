import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeDisciplineScore } from '@/lib/score'
import { getUtcMonthRange } from '@/lib/time'
import {
  categoryEmoji,
  currentWeekDays,
  firstNameFrom,
  formatNaira,
  monthName,
  relativeTime,
  transactionType,
} from '@/lib/format'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

type CategoryRow = { id: string; name: string; monthly_budget: string; color: string | null }
type SpendRow = { amount: string; category_id: string | null }
type WeekTxnRow = { amount: string; created_at: string }
type RecentRow = {
  id: string
  amount: string
  merchant_raw: string | null
  category_id: string | null
  created_at: string
}

type CategoryStatus = 'on_track' | 'near_limit' | 'over_budget'

function statusFromPct(pctUsed: number): CategoryStatus {
  if (pctUsed > 100) return 'over_budget'
  if (pctUsed >= 75) return 'near_limit'
  return 'on_track'
}

function badgeFromScore(score: number): string {
  if (score >= 85) return 'Financially Responsible'
  if (score >= 70) return 'Budget Conscious'
  if (score >= 55) return 'Getting There'
  if (score >= 40) return 'Needs Work'
  return 'Starting Fresh'
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const today = new Date()
    const { startIso, endIso, daysElapsed, daysInMonth, todayIsoDate } = getUtcMonthRange(today)

    const weekDays = currentWeekDays(today)
    const weekStartIso = weekDays[0].date.toISOString()
    const tomorrowIso = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)
    ).toISOString()

    const [categoriesResult, monthTxnsResult, dailyLogResult, streakResult, recentResult, weekTxnsResult] =
      await Promise.all([
        supabase
          .from('categories')
          .select('id, name, monthly_budget, color')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('transactions')
          .select('amount, category_id')
          .eq('user_id', user.id)
          .gte('created_at', startIso)
          .lt('created_at', endIso),
        supabase
          .from('daily_logs')
          .select('discipline_score')
          .eq('user_id', user.id)
          .eq('date', todayIsoDate)
          .maybeSingle(),
        supabase
          .from('streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('transactions')
          .select('id, amount, merchant_raw, category_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('transactions')
          .select('amount, created_at')
          .eq('user_id', user.id)
          .gte('created_at', weekStartIso)
          .lt('created_at', tomorrowIso),
      ])

    if (categoriesResult.error) return err(categoriesResult.error.message, 'db_error', 500)
    if (monthTxnsResult.error) return err(monthTxnsResult.error.message, 'db_error', 500)
    if (dailyLogResult.error) return err(dailyLogResult.error.message, 'db_error', 500)
    if (streakResult.error) return err(streakResult.error.message, 'db_error', 500)
    if (recentResult.error) return err(recentResult.error.message, 'db_error', 500)
    if (weekTxnsResult.error) return err(weekTxnsResult.error.message, 'db_error', 500)

    const categoryRows = (categoriesResult.data ?? []) as CategoryRow[]

    // ── Per-category spend (this month) ──────────────────────────
    const categoryMap = new Map<string, CategoryRow>()
    const spentByCategory = new Map<string, number>()
    for (const c of categoryRows) {
      categoryMap.set(c.id, c)
      spentByCategory.set(c.id, 0)
    }
    let totalSpent = 0
    for (const t of (monthTxnsResult.data ?? []) as SpendRow[]) {
      const amount = Number(t.amount)
      if (!Number.isFinite(amount)) continue
      totalSpent += amount
      if (!t.category_id) continue
      spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + amount)
    }
    const totalBudget = categoryRows.reduce((sum, c) => sum + Number(c.monthly_budget), 0)

    // ── Discipline score (today's log, else live) ────────────────
    const liveScore = computeDisciplineScore(
      categoryRows.map((c) => ({
        monthly_budget: Number(c.monthly_budget),
        spent_this_month: spentByCategory.get(c.id) ?? 0,
      })),
      daysElapsed,
      daysInMonth
    )
    const loggedScoreRaw = dailyLogResult.data?.discipline_score
    const parsedLogged = loggedScoreRaw == null ? null : Number(loggedScoreRaw)
    const scoreIsLive = parsedLogged == null || !Number.isFinite(parsedLogged)
    const score = Math.round(scoreIsLive ? liveScore : (parsedLogged as number))

    // ── Categories view-model + pick the alert candidate ─────────
    type CatVM = { id: string; name: string; emoji: string; spent: number; budget: number; status: CategoryStatus }
    let alertCandidate: { name: string; pct: number; spent: number; budget: number } | null = null

    const categories: CatVM[] = categoryRows.map((c) => {
      const budget = Number(c.monthly_budget)
      const spent = spentByCategory.get(c.id) ?? 0
      const pctUsed = budget > 0 ? (spent / budget) * 100 : spent > 0 ? 100 : 0
      if (!alertCandidate || pctUsed > alertCandidate.pct) {
        alertCandidate = { name: c.name, pct: pctUsed, spent, budget }
      }
      return { id: c.id, name: c.name, emoji: categoryEmoji(c.name), spent, budget, status: statusFromPct(pctUsed) }
    })

    let alert: { message: string; amountLine: string } | null = null
    if (alertCandidate) {
      const a = alertCandidate as { name: string; pct: number; spent: number; budget: number }
      if (a.pct >= 100) {
        alert = {
          message: `You've exceeded your ${a.name} budget.`,
          amountLine: `${formatNaira(a.spent - a.budget)} over in ${a.name}.`,
        }
      } else if (a.pct >= 75) {
        alert = {
          message: `You're getting close to your ${a.name} limit.`,
          amountLine: `${formatNaira(a.budget - a.spent)} left in ${a.name}.`,
        }
      }
    }

    // ── Weekly spend bars (Mon→Sun, future days 0) ───────────────
    const spentByDay = new Map<string, number>()
    for (const t of (weekTxnsResult.data ?? []) as WeekTxnRow[]) {
      const amount = Number(t.amount)
      if (!Number.isFinite(amount)) continue
      const key = t.created_at.slice(0, 10)
      spentByDay.set(key, (spentByDay.get(key) ?? 0) + amount)
    }
    const weeklySpend = weekDays.map((d) => ({
      day: d.letter,
      amount: spentByDay.get(d.key) ?? 0,
      isToday: d.isToday,
    }))

    // ── Recent transactions view-model ───────────────────────────
    const recentTransactions = ((recentResult.data ?? []) as RecentRow[]).map((t) => {
      const categoryName = (t.category_id ? categoryMap.get(t.category_id)?.name : null) ?? 'Uncategorised'
      const merchant = t.merchant_raw && t.merchant_raw.trim().length > 0 ? t.merchant_raw : categoryName
      return {
        id: t.id,
        name: merchant,
        timeLabel: `${relativeTime(t.created_at, today)} · ${categoryName}`,
        categoryName,
        amount: Math.abs(Number(t.amount)) || 0,
        type: transactionType(categoryName),
        emoji: categoryEmoji(categoryName),
      }
    })

    // ── User identity ────────────────────────────────────────────
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
    const fullName = typeof metadata.full_name === 'string' ? metadata.full_name : null
    const streakDays = streakResult.data?.current_streak ?? 0

    return ok({
      user: {
        firstName: firstNameFrom(fullName, user.email),
        streakDays,
      },
      disciplineScore: {
        score,
        brokeScore: 100 - score,
        badge: badgeFromScore(score),
        score_is_live: scoreIsLive,
      },
      budget: {
        monthLabel: `${monthName(today.getUTCMonth())} Budget`,
        total: totalBudget,
        spent: totalSpent,
        left: totalBudget - totalSpent,
        weeklySpend,
      },
      alert,
      categories,
      recentTransactions,
    })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
