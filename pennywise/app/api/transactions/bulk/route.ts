import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recomputeScoreAndStreak } from '@/lib/recompute'
import { applyRateLimit } from '@/lib/withRateLimit'
import { validate } from '@/lib/validate'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

const MAX_BULK = 50

// Contract §5 item shape, batched. `type` has no DB column yet — see TODO(migration).
interface BulkItem {
  name?: string
  amount?: number
  type?: 'expense' | 'income'
  categoryId?: string
  occurredAt?: string
  merchant_raw?: string
}
interface BulkBody {
  transactions?: BulkItem[]
}

type InsertRow = {
  user_id: string
  category_id: string
  amount: string
  merchant_raw: string | null
  source: 'manual'
  created_at?: string
}

export async function POST(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, 'standard')
    if (limited) return limited

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: BulkBody
    try {
      body = (await request.json()) as BulkBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const items = body.transactions
    if (!Array.isArray(items) || items.length < 1 || items.length > MAX_BULK) {
      return err(`transactions must be an array of 1–${MAX_BULK} items`, 'invalid_input', 400)
    }

    // Map each item to the DB shape (same rules as the single POST).
    const rows: InsertRow[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item) return err(`item ${i}: missing`, 'invalid_input', 400)

      const categoryId = validate.string(item.categoryId, 100)
      const amount = validate.number(item.amount)
      if (!categoryId || amount === null || amount <= 0) {
        return err(`item ${i}: categoryId and a positive numeric amount are required`, 'invalid_input', 400)
      }

      // Prefer an explicit merchant_raw, fall back to name; over-length → null.
      const merchant = validate.string(item.merchant_raw, 100) ?? validate.string(item.name, 100)

      const row: InsertRow = {
        user_id: user.id,
        category_id: categoryId,
        amount: String(amount),
        merchant_raw: merchant,
        source: 'manual',
      }

      // occurredAt → created_at. Override the DB default only when valid.
      if (typeof item.occurredAt === 'string') {
        const parsed = new Date(item.occurredAt)
        if (Number.isNaN(parsed.getTime())) {
          return err(`item ${i}: occurredAt must be a valid ISO-8601 date`, 'invalid_input', 400)
        }
        row.created_at = parsed.toISOString()
      }

      rows.push(row)
    }

    const { data, error: insertError } = await supabase.from('transactions').insert(rows).select('id')
    if (insertError) return err(insertError.message, 'db_error', 500)

    const inserted = data?.length ?? rows.length

    // Recompute once for the whole batch. A failure must NOT fail the insert.
    try {
      const { score, brokeScore, streak } = await recomputeScoreAndStreak(supabase, user.id)
      return ok({ inserted, score, brokeScore, streak })
    } catch (recomputeError) {
      console.error('Score/streak recompute after bulk insert failed:', recomputeError)
      return ok({ inserted })
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
