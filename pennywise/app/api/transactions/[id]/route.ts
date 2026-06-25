import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api-auth'
import { TRANSACTION_SELECT } from '@/lib/transactions/parse'
import { recomputeTodayScore } from '@/lib/scoring/recompute'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const { data, error: dbError } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
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
    const { id } = await params
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: PatchBody
    try {
      body = (await request.json()) as PatchBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const update: { note?: string | null; category_id?: string | null } = {}
    if ('note' in body) update.note = body.note ?? null
    if ('category_id' in body) update.category_id = body.category_id ?? null

    if (Object.keys(update).length === 0) {
      return err('Nothing to update — provide note or category_id', 'invalid_input', 400)
    }

    const { data, error: updateError } = await supabase
      .from('transactions')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(TRANSACTION_SELECT)
      .single()

    if (updateError) {
      const status = updateError.code === 'PGRST116' ? 404 : 500
      const code = updateError.code === 'PGRST116' ? 'not_found' : 'db_error'
      return err(updateError.message, code, status)
    }

    // Live score loop (mirrors POST /api/transactions): editing category/note
    // can move today's discipline score. Fire-and-forget — never block or fail
    // the response on it.
    recomputeTodayScore(supabase, user.id).catch(() => {})

    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) return err(deleteError.message, 'db_error', 500)

    // Live score loop (mirrors POST /api/transactions): removing a transaction
    // can move today's discipline score. Fire-and-forget.
    recomputeTodayScore(supabase, user.id).catch(() => {})

    return ok(null)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
