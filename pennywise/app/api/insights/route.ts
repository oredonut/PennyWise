import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api-auth'
import { getMonthKey } from '@/lib/time'
import { generateRoast, gradeFromScore } from '@/lib/roast'
import { dayAbbrUTC, monthName } from '@/lib/format'
import { buildObservations } from '@/lib/observations'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

type LogRow = { date: string; discipline_score: string | null }
type CategoryRow = { id: string; name: string; color: string | null; monthly_budget: string }
type TxnRow = { amount: string; category_id: string | null; merchant_raw?: string | null }

function num(value: string | null | undefined): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    // `range` is accepted for forward-compat but does NOT gate which arrays are
    // returned — both scoreTrend7d and scoreTrend30d are always present so the
    // mobile InsightsView can toggle client-side without refetching.
    void (new URL(request.url).searchParams.get('range') ?? new URL(request.url).searchParams.get('period'))

    const today = new Date()
    const y = today.getUTCFullYear()
    const m = today.getUTCMonth()
    const startOfMonth = new Date(Date.UTC(y, m, 1))
    const endOfMonth = new Date(Date.UTC(y, m + 1, 1))
    const startOfPrevMonth = new Date(Date.UTC(y, m - 1, 1))
    const last7Start = new Date(Date.UTC(y, m, today.getUTCDate() - 6))
    const iso = (d: Date) => d.toISOString()
    const dateKey = (d: Date) => d.toISOString().slice(0, 10)

    const [last7Result, categoriesResult, currentTxnsResult, previousTxnsResult, monthLogsResult, streakResult] =
      await Promise.all([
        supabase
          .from('daily_logs')
          .select('date, discipline_score')
          .eq('user_id', user.id)
          .gte('date', dateKey(last7Start))
          .lte('date', dateKey(today)),
        supabase
          .from('categories')
          .select('id, name, color, monthly_budget')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('transactions')
          .select('amount, category_id, merchant_raw')
          .eq('user_id', user.id)
          .gte('created_at', iso(startOfMonth))
          .lt('created_at', iso(endOfMonth)),
        supabase
          .from('transactions')
          .select('amount, category_id')
          .eq('user_id', user.id)
          .gte('created_at', iso(startOfPrevMonth))
          .lt('created_at', iso(startOfMonth)),
        supabase
          .from('daily_logs')
          .select('date, discipline_score')
          .eq('user_id', user.id)
          .gte('date', dateKey(startOfMonth))
          .lt('date', dateKey(endOfMonth)),
        supabase
          .from('streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

    if (last7Result.error) return err(last7Result.error.message, 'db_error', 500)
    if (categoriesResult.error) return err(categoriesResult.error.message, 'db_error', 500)
    if (currentTxnsResult.error) return err(currentTxnsResult.error.message, 'db_error', 500)
    if (previousTxnsResult.error) return err(previousTxnsResult.error.message, 'db_error', 500)
    if (monthLogsResult.error) return err(monthLogsResult.error.message, 'db_error', 500)
    if (streakResult.error) return err(streakResult.error.message, 'db_error', 500)

    const categoryRows = (categoriesResult.data ?? []) as CategoryRow[]
    const currentTxns = (currentTxnsResult.data ?? []) as TxnRow[]
    const previousTxns = (previousTxnsResult.data ?? []) as TxnRow[]
    const monthLogs = (monthLogsResult.data ?? []) as LogRow[]
    const last7Logs = (last7Result.data ?? []) as LogRow[]

    const categoryMap = new Map<string, CategoryRow>()
    for (const c of categoryRows) categoryMap.set(c.id, c)

    // ── Totals + per-category breakdown ──────────────────────────
    const categoryTotals = new Map<string, number>()
    let currentMonthTotal = 0
    for (const t of currentTxns) {
      const amount = num(t.amount)
      currentMonthTotal += amount
      if (t.category_id) categoryTotals.set(t.category_id, (categoryTotals.get(t.category_id) ?? 0) + amount)
    }
    const previousMonthTotal = previousTxns.reduce((s, t) => s + num(t.amount), 0)
    const totalBudget = categoryRows.reduce((s, c) => s + num(c.monthly_budget), 0)

    const breakdown = categoryRows.map((c) => {
      const amount = categoryTotals.get(c.id) ?? 0
      const percentage = currentMonthTotal > 0 ? Math.round((amount / currentMonthTotal) * 100) : 0
      return { id: c.id, name: c.name, percentage, amount, color: c.color }
    })

    // ── Score trends (both windows always returned) ──────────────
    const last7Map = new Map<string, number>()
    for (const log of last7Logs) last7Map.set(log.date, num(log.discipline_score))
    const scoreTrend7d = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.UTC(y, m, today.getUTCDate() - (6 - i)))
      return { label: dayAbbrUTC(d), score: last7Map.get(dateKey(d)) ?? 0 }
    })

    const weekBuckets = [
      { sum: 0, count: 0 },
      { sum: 0, count: 0 },
      { sum: 0, count: 0 },
      { sum: 0, count: 0 },
    ]
    for (const log of monthLogs) {
      const day = Number(log.date.slice(8, 10))
      const idx = Math.min(Math.max(Math.ceil(day / 7), 1), 4) - 1
      weekBuckets[idx].sum += num(log.discipline_score)
      weekBuckets[idx].count += 1
    }
    const scoreTrend30d = weekBuckets.map((b, i) => ({
      label: `Wk${i + 1}`,
      score: b.count > 0 ? Math.round(b.sum / b.count) : 0,
    }))

    // ── Average score → grade (or 50 when no logs) ───────────────
    const avgScore =
      monthLogs.length === 0 ? 50 : monthLogs.reduce((s, l) => s + num(l.discipline_score), 0) / monthLogs.length

    // ── Observation aggregates (DB-derived) → pure rule engine ───
    const merchantSums = new Map<string, number>()
    for (const t of currentTxns) {
      const merchant = t.merchant_raw
      if (!merchant) continue
      merchantSums.set(merchant, (merchantSums.get(merchant) ?? 0) + num(t.amount))
    }
    let topMerchant: { name: string; amount: number } | null = null
    for (const [name, amount] of merchantSums) {
      if (!topMerchant || amount > topMerchant.amount) topMerchant = { name, amount }
    }

    const transportSpend = (txns: TxnRow[]) =>
      txns.reduce((s, t) => {
        const name = (t.category_id ? categoryMap.get(t.category_id)?.name : '') ?? ''
        return name.toLowerCase().includes('transport') ? s + num(t.amount) : s
      }, 0)

    const sortedLogs = [...monthLogs].sort((a, b) => a.date.localeCompare(b.date))
    const scoreDelta =
      sortedLogs.length >= 2
        ? Math.round(num(sortedLogs[sortedLogs.length - 1].discipline_score) - num(sortedLogs[0].discipline_score))
        : 0

    let worstOver: { name: string; over: number } | null = null
    for (const c of categoryRows) {
      const budget = num(c.monthly_budget)
      const spent = categoryTotals.get(c.id) ?? 0
      if (budget > 0 && spent > budget) {
        const over = spent - budget
        if (!worstOver || over > worstOver.over) worstOver = { name: c.name, over }
      }
    }

    const topObservations = buildObservations({
      currentMonthTotal,
      totalBudget,
      topMerchant,
      thisTransport: transportSpend(currentTxns),
      lastTransport: transportSpend(previousTxns),
      currentStreak: streakResult.data?.current_streak ?? 0,
      scoreDelta,
      worstOver,
    })

    // ── Month comparison ─────────────────────────────────────────
    const difference = currentMonthTotal - previousMonthTotal
    const percentage =
      previousMonthTotal === 0
        ? currentMonthTotal === 0
          ? 0
          : 100
        : Math.round((Math.abs(difference) / previousMonthTotal) * 1000) / 10

    // ── Roast (with month field) ─────────────────────────────────
    const baseRoast =
      currentTxns.length >= 3
        ? generateRoast({
            userId: user.id,
            yearMonth: getMonthKey(today),
            grade: gradeFromScore(avgScore),
            topCategory: pickTopCategoryKey(breakdown),
            topMerchant: topMerchant ? topMerchant.name : null,
            topAmount: breakdown.reduce((max, b) => (b.amount > max ? b.amount : max), 0),
            totalSpent: currentMonthTotal,
            totalBudget,
            month: monthName(m),
            nextMonth: monthName(m + 1),
          })
        : null
    const roast = baseRoast ? { grade: baseRoast.grade, month: monthName(m), message: baseRoast.message } : null

    return ok({
      monthYear: `${monthName(m)} ${y}`,
      weekLabel: `Week ${Math.ceil(today.getUTCDate() / 7)}`,
      totalSpent: currentMonthTotal,
      scoreTrend7d,
      scoreTrend30d,
      breakdown,
      observations: topObservations,
      comparison: {
        lastMonthName: monthName(m - 1),
        lastMonthSpent: previousMonthTotal,
        currentMonthName: `${monthName(m)} (so far)`,
        currentMonthSpent: currentMonthTotal,
        difference,
        percentage,
        isSavings: currentMonthTotal < previousMonthTotal,
      },
      roast,
    })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}

const CATEGORY_KEYS = ['food', 'transport', 'data', 'leisure', 'groceries', 'rent', 'misc']

/** Map the top-spend category name to a roast bucket key, defaulting to 'misc'. */
function pickTopCategoryKey(breakdown: ReadonlyArray<{ name: string; amount: number }>): string {
  let top: { name: string; amount: number } | null = null
  for (const b of breakdown) {
    if (b.amount > 0 && (!top || b.amount > top.amount)) top = b
  }
  if (!top) return 'misc'
  const normalized = top.name.trim().toLowerCase()
  return CATEGORY_KEYS.includes(normalized) ? normalized : 'misc'
}
