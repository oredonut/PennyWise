import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api-auth'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

// DELETE /api/account — soft-delete the signed-in user's account.
//
// Marks public.users.deleted_at with the current timestamp. It does NOT delete
// the auth user or wipe data (that's a heavier, irreversible op left for later).
//
// KNOWN GAP (pre-launch): a soft-deleted user is NOT yet blocked from signing
// back in — no middleware checks deleted_at on login. This records intent only.
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const { error: dbError } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', user.id)

    if (dbError) return err(dbError.message, 'db_error', 500)

    return ok(null)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
