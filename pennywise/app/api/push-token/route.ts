import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

interface PushTokenBody {
  token?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: PushTokenBody
    try {
      body = (await request.json()) as PushTokenBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const token = typeof body.token === 'string' ? body.token.trim() : ''
    if (!token) return err('token must be a non-empty string', 'invalid_input', 400)

    const { error: updateError } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', user.id)

    if (updateError) return err(updateError.message, 'db_error', 500)

    return ok({ ok: true })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
