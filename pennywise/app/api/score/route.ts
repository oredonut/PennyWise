import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api-auth'
import { computeBrokeScore } from '@/lib/scoring/compute'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

export async function GET(request: Request) {
  try {
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const today = new Date().toISOString().slice(0, 10)

    const [{ data: log }, { data: streak }] = await Promise.all([
      supabase
        .from('daily_logs')
        .select('date, discipline_score, total_spent')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle(),
      supabase
        .from('streaks')
        .select('current_streak, longest_streak, last_logged_at')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const disciplineScore = log?.discipline_score != null ? parseFloat(log.discipline_score) : null
    const brokeScore = disciplineScore !== null ? computeBrokeScore(disciplineScore) : null

    return ok({ daily_log: log, streak, broke_score: brokeScore })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
