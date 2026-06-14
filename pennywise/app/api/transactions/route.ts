import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recomputeTodayScore } from '@/lib/scoring/recompute'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
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

interface TransactionBody {
  category_id: string
  amount: number
  note?: string
  source?: 'manual' | 'screenshot' | 'sms' | 'recurring'
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

    if (!body.category_id || typeof body.amount !== 'number') {
      return err('category_id and amount are required', 'invalid_input', 400)
    }

    const { data, error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        category_id: body.category_id,
        amount: String(body.amount),
        note: body.note ?? null,
        source: body.source ?? 'manual',
      })
      .select('id, category_id, amount, note, source, merchant_raw, created_at')
      .single()

    if (insertError) return err(insertError.message, 'db_error', 500)

    // Fire-and-forget — don't block the POST response on score recompute
    recomputeTodayScore(supabase, user.id, { [body.category_id]: body.amount }).catch(() => {})

    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
