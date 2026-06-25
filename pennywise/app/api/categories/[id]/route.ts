import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api-auth'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

type RouteContext = { params: Promise<{ id: string }> }

const SELECT = 'id, name, monthly_budget, color, is_custom'

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const { data, error: dbError } = await supabase
      .from('categories')
      .select(SELECT)
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
  monthly_budget?: unknown
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

    if (body.monthly_budget === undefined || body.monthly_budget === null) {
      return err('monthly_budget is required', 'invalid_input', 400)
    }
    const amount =
      typeof body.monthly_budget === 'number' ? body.monthly_budget : Number(body.monthly_budget)
    if (!Number.isFinite(amount) || amount <= 0) {
      return err('monthly_budget must be a number greater than 0', 'invalid_input', 400)
    }

    // Ownership-scoped UPDATE (same shape as transactions/[id]): the user_id
    // filter means another user's category can't be touched, and a no-match
    // surfaces as PGRST116 → not_found. monthly_budget is stored as a string
    // (numeric), matching the categories POST and the rest of the schema.
    const { data, error: updateError } = await supabase
      .from('categories')
      .update({ monthly_budget: String(amount) })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(SELECT)
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
