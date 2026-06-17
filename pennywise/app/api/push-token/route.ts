import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

// POST — store the device's Expo push token on the user row (users.push_token,
// migration 006). The mobile app posts { token } on launch; the response is not
// read, so a simple { ok: true } is enough.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: { token?: unknown }
    try {
      body = (await request.json()) as { token?: unknown }
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const token = typeof body.token === 'string' ? body.token.trim() : ''
    if (!token) return err('token is required', 'invalid_input', 400)

    // The user row already exists (created by the on_auth_user_created trigger),
    // so a scoped UPDATE is the right write here — RLS limits it to self.
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
