import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeDisciplineScore } from '@/lib/score'
import { getUtcMonthRange } from '@/lib/time'
import { categoryEmoji, relativeTime, transactionType } from '@/lib/format'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// Supabase nests an embedded relation as either an object or a single-element
// array depending on the inferred cardinality; normalise to one name string.
type JoinedCategory = { name: string | null } | { name: string | null }[] | null
type TxnRow = {
  id: string
  amount: string
  merchant_raw: string | null
  category_id: string | null
  created_at: string
  categories?: JoinedCategory
}

/** Contract §6 transaction view-model — shared by POST response and GET list items. */
type TransactionVM = {
  id: string
  name: string
  amount: number
  type: 'expense' | 'income'
  categoryName: string
  emoji: string
  occurredAt: string
  timeLabel: string
}

// Opaque keyset cursor: base64(JSON) of the last row's ordering key.
type Cursor = { created_at: string; id: string }

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64')
}

function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')) as Partial<Cursor>
    if (typeof parsed.created_at === 'string' && typeof parsed.id === 'string') {
      return { created_at: parsed.created_at, id: parsed.id }
    }
    return null
  } catch {
    return null
  }
}

function categoryNameFromJoin(joined: JoinedCategory): string | null {
  if (!joined) return null
  const row = Array.isArray(joined) ? joined[0] : joined
  return row?.name ?? null
}

/** Build the contract view-model from a raw row, mirroring the dashboard's logic. */
function toTransactionVM(row: TxnRow, categoryName: string | null, now: Date): TransactionVM {
  const resolvedCategory = categoryName ?? 'Uncategorised'
  const merchant =
    row.merchant_raw && row.merchant_raw.trim().length > 0 ? row.merchant_raw : resolvedCategory
  return {
    id: row.id,
    name: merchant,
    amount: Math.abs(Number(row.amount)) || 0,
    type: transactionType(resolvedCategory),
    categoryName: resolvedCategory,
    emoji: categoryEmoji(resolvedCategory),
    occurredAt: row.created_at,
    timeLabel: `${relativeTime(row.created_at, now)} · ${resolvedCategory}`,
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const params = new URL(request.url).searchParams
    const cursorRaw = params.get('cursor')
    const limitParam = Number(params.get('limit'))
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(Math.floor(limitParam), MAX_LIMIT)
        : DEFAULT_LIMIT

    // Fetch limit+1 to detect whether another page exists.
    let query = supabase
      .from('transactions')
      .select('id, amount, merchant_raw, category_id, created_at, categories(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1)

    if (cursorRaw) {
      const decoded = decodeCursor(cursorRaw)
      if (!decoded) return err('Invalid cursor', 'invalid_input', 400)
      // Composite keyset: older timestamp, OR same timestamp with a lower id.
      query = query.or(
        `created_at.lt.${decoded.created_at},and(created_at.eq.${decoded.created_at},id.lt.${decoded.id})`
      )
    }

    const { data, error: dbError } = await query
    if (dbError) return err(dbError.message, 'db_error', 500)

    // Cast via unknown: the embedded categories(name) relation isn't in the
    // generated Supabase types, so it resolves to a branded SelectQueryError.
    const rows = (data ?? []) as unknown as TxnRow[]
    const hasMore = rows.length > limit
    const pageRows = hasMore ? rows.slice(0, limit) : rows
    const last = pageRows[pageRows.length - 1]
    const nextCursor =
      hasMore && last ? encodeCursor({ created_at: last.created_at, id: last.id }) : null

    const now = new Date()
    const transactions = pageRows.map((row) =>
      toTransactionVM(row, categoryNameFromJoin(row.categories ?? null), now)
    )

    return ok({ transactions, nextCursor, hasMore })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}

// Contract §5 request shape. `type` has no DB column yet — see TODO(migration) below.
interface TransactionBody {
  name?: string
  amount?: number
  type?: 'expense' | 'income'
  categoryId?: string
  occurredAt?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: TransactionBody
    try {
      body = (await request.json()) as TransactionBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    if (!body.categoryId || typeof body.amount !== 'number' || !Number.isFinite(body.amount)) {
      return err('categoryId and a numeric amount are required', 'invalid_input', 400)
    }

    const name = typeof body.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : null

    // occurredAt → created_at. Only override the DB default when a valid date is sent.
    let createdAt: string | null = null
    if (typeof body.occurredAt === 'string') {
      const parsed = new Date(body.occurredAt)
      if (Number.isNaN(parsed.getTime())) {
        return err('occurredAt must be a valid ISO-8601 date', 'invalid_input', 400)
      }
      createdAt = parsed.toISOString()
    }

    // TODO(migration): persist body.type once transactions has an income/expense
    // column. Until then type is inferred from the category name on read.
    const baseInsert = {
      user_id: user.id,
      category_id: body.categoryId,
      amount: String(body.amount),
      merchant_raw: name,
      source: 'manual' as const,
    }
    const insertRow = createdAt ? { ...baseInsert, created_at: createdAt } : baseInsert

    const { data, error: insertError } = await supabase
      .from('transactions')
      .insert(insertRow)
      .select('id, amount, merchant_raw, category_id, created_at, categories(name)')
      .single()

    if (insertError) return err(insertError.message, 'db_error', 500)

    const row = data as unknown as TxnRow
    const vm = toTransactionVM(row, categoryNameFromJoin(row.categories ?? null), new Date())

    // ── Synchronous score + streak recompute ─────────────────────
    // The transaction is already committed; a failure here must NOT fail the
    // insert. On any error we log and return the bare transaction view-model.
    try {
      const today = new Date()
      const { startIso, endIso, daysElapsed, daysInMonth, todayIsoDate } = getUtcMonthRange(today)

      const [categoriesResult, monthTxnsResult, streakResult] = await Promise.all([
        supabase.from('categories').select('id, monthly_budget').eq('user_id', user.id),
        supabase
          .from('transactions')
          .select('amount, category_id')
          .eq('user_id', user.id)
          .gte('created_at', startIso)
          .lt('created_at', endIso),
        supabase
          .from('streaks')
          .select('current_streak, longest_streak, last_logged_at')
          .eq('user_id', user.id)
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
          user_id: user.id,
          date: todayIsoDate,
          discipline_score: String(score),
          total_spent: String(totalSpent),
        },
        { onConflict: 'user_id,date' }
      )
      if (logError) throw logError

      // ── Streak update ──────────────────────────────────────────
      const yesterdayIso = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1)
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
            user_id: user.id,
            current_streak: nextStreak,
            longest_streak: nextLongest,
            last_logged_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        if (streakError) throw streakError
        streak = nextStreak
      }

      return ok({ ...vm, score, brokeScore: 100 - score, streak })
    } catch (recomputeError) {
      console.error('Score/streak recompute after transaction insert failed:', recomputeError)
      return ok(vm)
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
