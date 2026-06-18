import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api-auth'
import { recomputeTodayScore, type RecomputeResult } from '@/lib/scoring/recompute'
import {
  parseTransactionInput,
  TRANSACTION_SELECT,
  type MappedTransaction,
} from '@/lib/transactions/parse'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

// Guard against a runaway payload; the OCR confirm flow sends a handful of rows.
const MAX_BULK = 100

type InsertRow = MappedTransaction & { user_id: string; source: 'screenshot' }

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: { transactions?: unknown }
    try {
      body = (await request.json()) as { transactions?: unknown }
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const items = body.transactions
    if (!Array.isArray(items) || items.length === 0) {
      return err('transactions must be a non-empty array', 'invalid_input', 400)
    }
    if (items.length > MAX_BULK) {
      return err(`too many transactions (max ${MAX_BULK})`, 'invalid_input', 400)
    }

    // Validate/map every item up front; reject the whole batch if any is bad so
    // the user never ends up with a partial save.
    const rows: InsertRow[] = []
    const addedByCategory: Record<string, number> = {}
    for (let i = 0; i < items.length; i++) {
      const parsed = parseTransactionInput(items[i])
      if (!parsed.ok) return err(`transactions[${i}]: ${parsed.error}`, 'invalid_input', 400)
      rows.push({ user_id: user.id, source: 'screenshot', ...parsed.row })
      addedByCategory[parsed.categoryId] =
        (addedByCategory[parsed.categoryId] ?? 0) + parsed.amount
    }

    const { data, error: insertError } = await supabase
      .from('transactions')
      .insert(rows)
      .select(TRANSACTION_SELECT)

    if (insertError) return err(insertError.message, 'db_error', 500)

    // Recompute ONCE for the whole batch — N inserts must trigger a single
    // score/streak update, not N of them. Same best-effort contract as the
    // single route: the rows are already committed, so a scoring failure
    // returns null numbers rather than a 500.
    let recompute: RecomputeResult = { score: null, brokeScore: null, streak: null }
    try {
      recompute = await recomputeTodayScore(supabase, user.id, addedByCategory)
    } catch {
      // best-effort — surface the saved transactions regardless
    }

    return ok({ transactions: data, ...recompute })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
