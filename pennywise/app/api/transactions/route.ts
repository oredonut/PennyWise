import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api-auth'
import { recomputeTodayScore, type RecomputeResult } from '@/lib/scoring/recompute'
import { parseTransactionInput, TRANSACTION_SELECT } from '@/lib/transactions/parse'
import { categoryEmoji, relativeTime } from '@/lib/format'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

// History list. Returns the mobile's TransactionsPage shape
// ({ transactions, nextCursor, hasMore }) with the same per-item view-model the
// dashboard's Recent list uses, plus created_at cursor pagination.
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const url = new URL(request.url)
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 50)
    const cursor = url.searchParams.get('cursor') // ISO created_at of the last seen row

    let query = supabase
      .from('transactions')
      .select('id, category_id, amount, type, note, merchant_raw, occurred_at, created_at, categories(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit + 1) // fetch one extra to detect hasMore
    if (cursor) query = query.lt('created_at', cursor)

    const { data, error: dbError } = await query
    if (dbError) return err(dbError.message, 'db_error', 500)

    const rows = (data ?? []) as any[]
    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const now = new Date()

    const transactions = page.map((r) => {
      const cat = Array.isArray(r.categories) ? r.categories[0] : r.categories
      const categoryName: string = cat?.name ?? 'Uncategorised'
      // Fallback chain mirrors the dashboard Recent list (+ note), kept in sync
      // with TxnDetailScreen so a row and its detail show the same title.
      const name =
        (r.merchant_raw && r.merchant_raw.trim()) ||
        (r.note && r.note.trim()) ||
        categoryName
      return {
        id: r.id,
        name,
        amount: Math.abs(Number(r.amount)) || 0,
        type: (r.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
        categoryName,
        emoji: categoryEmoji(categoryName),
        occurredAt: r.occurred_at ?? r.created_at,
        timeLabel: `${relativeTime(r.created_at, now)} · ${categoryName}`,
      }
    })

    const nextCursor = hasMore ? page[page.length - 1].created_at : null
    return ok({ transactions, nextCursor, hasMore })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    // Shared with POST /api/transactions/bulk — see lib/transactions/parse.ts.
    const parsed = parseTransactionInput(body)
    if (!parsed.ok) return err(parsed.error, 'invalid_input', 400)

    const { data, error: insertError } = await supabase
      .from('transactions')
      .insert({ user_id: user.id, source: 'manual', ...parsed.row })
      .select(TRANSACTION_SELECT)
      .single()

    if (insertError) return err(insertError.message, 'db_error', 500)

    // Live score loop: recompute synchronously so the response can carry the
    // fresh score/streak (mobile's SubmitResult). The transaction is already
    // committed, so a scoring failure must NOT fail the request — fall back to
    // null numbers rather than 500 (which could trigger an offline re-submit).
    let recompute: RecomputeResult = { score: null, brokeScore: null, streak: null }
    try {
      recompute = await recomputeTodayScore(supabase, user.id, {
        [parsed.categoryId]: parsed.amount,
      })
    } catch {
      // best-effort — surface the saved transaction regardless
    }

    return ok({ ...data, ...recompute })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
