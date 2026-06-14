import { createClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../../../types/database.ts'

type UserRow = { id: string; push_token: string | null }

function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Inline Expo push (Deno fetch) — best-effort, never throws.
async function sendPush(token: string, title: string, body: string): Promise<void> {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, title, body, sound: 'default', priority: 'normal' }),
    })
  } catch (_) {
    // ignore
  }
}

Deno.serve(async () => {
  const errors: string[] = []
  let sent = 0

  try {
    const supabase = createServiceClient()
    const todayKey = new Date().toISOString().slice(0, 10)

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, push_token')
    if (usersError) throw new Error(usersError.message)

    for (const user of (users ?? []) as UserRow[]) {
      try {
        const token = user.push_token
        if (!token) continue

        const { data: streak, error: streakError } = await supabase
          .from('streaks')
          .select('last_logged_at')
          .eq('user_id', user.id)
          .maybeSingle()
        if (streakError) throw new Error(streakError.message)

        const lastKey = streak?.last_logged_at ? streak.last_logged_at.slice(0, 10) : null
        if (lastKey === todayKey) continue // already logged today — streak safe

        await sendPush(
          token,
          "Don't break your streak 🔥",
          'Log a transaction before midnight to keep your streak alive.',
        )
        sent += 1
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    return new Response(JSON.stringify({ sent, errors }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return new Response(JSON.stringify({ sent, errors }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    })
  }
})
