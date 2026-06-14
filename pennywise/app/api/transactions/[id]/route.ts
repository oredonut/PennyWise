import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/withRateLimit'
import { validate } from '@/lib/validate'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
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

    const { data, error: dbError } = await supabase
      .from('transactions')
      .select('id, category_id, amount, note, source, merchant_raw, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (dbError) {
      const status = dbError.code === 'PGRST116' ? 404 : 500
      const code = dbError.code === 'PGRST116' ? 'not_found' : 'db_error'
      return err(dbError.message, code, status)
    }
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}

interface PatchBody {
  note?: string | null
  category_id?: string | null
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

    let body: PatchBody
    try {
      body = (await request.json()) as PatchBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const update: { note?: string | null; category_id?: string | null } = {}
    if ('note' in body) {
      if (body.note == null || (typeof body.note === 'string' && body.note.trim() === '')) {
        update.note = null
      } else {
        const note = validate.string(body.note, 500)
        if (note === null) return err('note must be at most 500 characters', 'invalid_input', 400)
        update.note = note
      }
    }
    if ('category_id' in body) {
      if (body.category_id == null) {
        update.category_id = null
      } else {
        const cat = validate.string(body.category_id, 100)
        if (!cat) return err('category_id must be a non-empty string', 'invalid_input', 400)
        update.category_id = cat
      }
    }

    if (Object.keys(update).length === 0) {
      return err('Nothing to update — provide note or category_id', 'invalid_input', 400)
    }

    const { data, error: updateError } = await supabase
      .from('transactions')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, category_id, amount, note, source, merchant_raw, created_at')
      .single()

    if (updateError) {
      const status = updateError.code === 'PGRST116' ? 404 : 500
      const code = updateError.code === 'PGRST116' ? 'not_found' : 'db_error'
      return err(updateError.message, code, status)
    }
    return ok(data)
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

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) return err(deleteError.message, 'db_error', 500)
    return ok(null)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
