// ============================================================
// Bearer-token auth for API routes.
//
// The mobile app authenticates with an `Authorization: Bearer <jwt>` header —
// it can't ship Supabase's SSR auth cookies. The cookie-based createClient() in
// ./server only reads cookies, so native requests always 401'd. This helper
// reads the bearer token when present and verifies it with a stateless
// supabase-js client, falling back to the cookie flow for any web/SSR callers.
// ============================================================

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
  type User,
  type AuthError,
} from '@supabase/supabase-js'
import { createClient } from './server'
import type { Database } from '@/types/database'

type AuthResult = {
  user: User | null
  error: AuthError | null
  supabase: SupabaseClient<Database>
}

export async function getAuthenticatedUser(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
      )
    }

    // Stateless client: no session persistence/refresh. The request carries its
    // own bearer token, which getUser() validates against the Auth server.
    const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    return { user, error, supabase }
  }

  // No bearer token — fall back to the cookie-based SSR client (web/SSR usage).
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error, supabase }
}
