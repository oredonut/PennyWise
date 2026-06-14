import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/withRateLimit'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

export async function GET(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, 'standard')
    if (limited) return limited

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const { data, error: streakError } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .maybeSingle()

    if (streakError) return err(streakError.message, 'db_error', 500)

    const streak = data ?? { current_streak: 0, longest_streak: 0 }
    return ok({ currentStreak: streak.current_streak, longestStreak: streak.longest_streak })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
