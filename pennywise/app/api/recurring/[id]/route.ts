import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/withRateLimit'
import { validate } from '@/lib/validate'
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
    const limited = applyRateLimit(request, 'standard')
    if (limited) return limited

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
    if ('categoryId' in body) {
      const cat = validate.string(body.categoryId, 100)
      if (!cat) return err('categoryId must be a non-empty string', 'invalid_input', 400)
      update.category_id = cat
    }
    if ('amount' in body) {
      const amount = validate.number(body.amount)
      if (amount === null || amount <= 0) {
        return err('amount must be a positive number', 'invalid_input', 400)
      }
      update.amount = String(amount)
    }
    if ('note' in body) {
      if (body.note == null || (typeof body.note === 'string' && body.note.trim() === '')) {
        update.note = null
      } else {
        const note = validate.string(body.note, 500)
        if (note === null) return err('note must be at most 500 characters', 'invalid_input', 400)
        update.note = note
      }
    }
    if ('frequency' in body) {
      const frequency = validate.enum(body.frequency, [...FREQUENCIES])
      if (!frequency) {
        return err("frequency must be 'weekly' or 'monthly'", 'invalid_input', 400)
      }
      update.frequency = frequency
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

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const limited = applyRateLimit(request, 'standard')
    if (limited) return limited

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
