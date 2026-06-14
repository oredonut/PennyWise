import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toRuleVM, type RuleRow } from '../route'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

const FREQUENCIES = ['weekly', 'monthly'] as const
type Frequency = (typeof FREQUENCIES)[number]

const RULE_SELECT = 'id, category_id, amount, note, frequency, next_fire_at, categories(name)'

type RouteContext = { params: Promise<{ id: string }> }

interface PatchRuleBody {
  categoryId?: string
  amount?: number
  note?: string | null
  frequency?: string
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: PatchRuleBody
    try {
      body = (await request.json()) as PatchRuleBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    // Build the update from only the provided fields.
    const update: { category_id?: string; amount?: string; note?: string | null; frequency?: Frequency } = {}
    if ('categoryId' in body && typeof body.categoryId === 'string') update.category_id = body.categoryId
    if ('amount' in body) {
      if (typeof body.amount !== 'number' || !Number.isFinite(body.amount)) {
        return err('amount must be a number', 'invalid_input', 400)
      }
      update.amount = String(body.amount)
    }
    if ('note' in body) {
      update.note =
        typeof body.note === 'string' && body.note.trim().length > 0 ? body.note.trim() : null
    }
    if ('frequency' in body) {
      if (!FREQUENCIES.includes(body.frequency as Frequency)) {
        return err("frequency must be 'weekly' or 'monthly'", 'invalid_input', 400)
      }
      update.frequency = body.frequency as Frequency
    }

    if (Object.keys(update).length === 0) {
      return err('Nothing to update', 'invalid_input', 400)
    }

    // Ownership enforced by the user_id filter; no match → 404.
    const { data, error: updateError } = await supabase
      .from('recurring_rules')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(RULE_SELECT)
      .single()

    if (updateError) {
      const status = updateError.code === 'PGRST116' ? 404 : 500
      const code = updateError.code === 'PGRST116' ? 'not_found' : 'db_error'
      return err(updateError.message, code, status)
    }

    return ok({ rule: toRuleVM(data as unknown as RuleRow) })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    // Ownership enforced by the user_id filter.
    const { error: deleteError } = await supabase
      .from('recurring_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) return err(deleteError.message, 'db_error', 500)

    return ok({ ok: true })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
