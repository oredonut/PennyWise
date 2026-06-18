import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api-auth'
import { recomputeTodayScore, type RecomputeResult } from '@/lib/scoring/recompute'
import { parseTransactionInput, TRANSACTION_SELECT } from '@/lib/transactions/parse'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const since = new Date()
    since.setDate(since.getDate() - 30)

    const { data, error: dbError } = await supabase
      .from('transactions')
      .select('id, category_id, amount, note, source, merchant_raw, created_at, categories(name)')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    if (dbError) return err(dbError.message, 'db_error', 500)
    return ok(data)
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
