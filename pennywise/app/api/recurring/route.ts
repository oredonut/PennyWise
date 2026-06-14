import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/withRateLimit'
import { validate } from '@/lib/validate'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

const FREQUENCIES = ['weekly', 'monthly'] as const

// Embedded categories(name) isn't in the generated relation types, so reads are
// cast via unknown; the relation resolves at runtime through PostgREST.
type JoinedCategory = { name: string | null } | { name: string | null }[] | null
export type RuleRow = {
  id: string
  category_id: string
  amount: string
  note: string | null
  frequency: string | null
  next_fire_at: string
  categories?: JoinedCategory
}

export function categoryNameFromJoin(joined: JoinedCategory): string | null {
  if (!joined) return null
  const row = Array.isArray(joined) ? joined[0] : joined
  return row?.name ?? null
}

export function toRuleVM(row: RuleRow) {
  return {
    id: row.id,
    category_id: row.category_id,
    category_name: categoryNameFromJoin(row.categories ?? null),
    amount: Number(row.amount),
    note: row.note,
    frequency: row.frequency,
    next_fire_at: row.next_fire_at,
  }
}

/** Tomorrow at UTC midnight — the first fire is the day after creation. */
export function tomorrowUtcIso(now: Date = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  ).toISOString()
}

const RULE_SELECT = 'id, category_id, amount, note, frequency, next_fire_at, categories(name)'

export async function GET(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, 'standard')
    if (limited) return limited

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const { data, error: dbError } = await supabase
      .from('recurring_rules')
      .select(RULE_SELECT)
      .eq('user_id', user.id)
      .order('next_fire_at', { ascending: true })

    if (dbError) return err(dbError.message, 'db_error', 500)

    const rules = ((data ?? []) as unknown as RuleRow[]).map(toRuleVM)
    return ok({ rules })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}

interface CreateRuleBody {
  categoryId?: string
  amount?: number
  note?: string
  frequency?: string
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

    let body: CreateRuleBody
    try {
      body = (await request.json()) as CreateRuleBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const categoryId = validate.string(body.categoryId, 100)
    const amount = validate.number(body.amount)
    const frequency = validate.enum(body.frequency, [...FREQUENCIES])
    if (!categoryId || amount === null || amount <= 0) {
      return err('categoryId and a positive numeric amount are required', 'invalid_input', 400)
    }
    if (!frequency) {
      return err("frequency must be 'weekly' or 'monthly'", 'invalid_input', 400)
    }

    const { data, error: insertError } = await supabase
      .from('recurring_rules')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        amount: String(amount),
        note: validate.string(body.note, 500),
        frequency,
        next_fire_at: tomorrowUtcIso(),
      })
      .select(RULE_SELECT)
      .single()

    if (insertError) return err(insertError.message, 'db_error', 500)

    return ok({ rule: toRuleVM(data as unknown as RuleRow) })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
