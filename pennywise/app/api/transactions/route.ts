import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recomputeScoreAndStreak } from '@/lib/recompute'
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

    // Synchronous score + streak recompute. The transaction is already committed,
    // so a recompute failure must NOT fail the insert — log and return bare vm.
    try {
      const { score, brokeScore, streak } = await recomputeScoreAndStreak(supabase, user.id)
      return ok({ ...vm, score, brokeScore, streak })
    } catch (recomputeError) {
      console.error('Score/streak recompute after transaction insert failed:', recomputeError)
      return ok(vm)
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
