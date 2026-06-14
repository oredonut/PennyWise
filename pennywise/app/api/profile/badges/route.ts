import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/withRateLimit'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

type BadgeStatus = 'Unlocked' | 'Locked'
type Badge = { id: string; name: string; emoji: string; status: BadgeStatus; desc: string }

const unlock = (condition: boolean): BadgeStatus => (condition ? 'Unlocked' : 'Locked')

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

    // No badges table yet — derive a static set from the user's live stats.
    const [streakResult, txnCountResult, categoryCountResult, latestLogResult] = await Promise.all([
      supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('daily_logs')
        .select('discipline_score')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (streakResult.error) return err(streakResult.error.message, 'db_error', 500)
    if (txnCountResult.error) return err(txnCountResult.error.message, 'db_error', 500)
    if (categoryCountResult.error) return err(categoryCountResult.error.message, 'db_error', 500)
    if (latestLogResult.error) return err(latestLogResult.error.message, 'db_error', 500)

    const currentStreak = streakResult.data?.current_streak ?? 0
    const longestStreak = streakResult.data?.longest_streak ?? 0
    const txnCount = txnCountResult.count ?? 0
    const categoryCount = categoryCountResult.count ?? 0
    const rawScore = latestLogResult.data?.discipline_score
    const latestScore = rawScore == null ? 0 : Number(rawScore)
    const safeScore = Number.isFinite(latestScore) ? latestScore : 0

    const badges: Badge[] = [
      {
        id: 'first-log',
        name: 'First Step',
        emoji: '👣',
        status: unlock(txnCount >= 1),
        desc: 'Log your first transaction',
      },
      {
        id: 'week-streak',
        name: 'Week Warrior',
        emoji: '🔥',
        status: unlock(currentStreak >= 7),
        desc: 'Log every day for 7 days',
      },
      {
        id: 'budget-set',
        name: 'Planner',
        emoji: '📋',
        status: unlock(categoryCount >= 3),
        desc: 'Set up 3 or more budget categories',
      },
      {
        id: 'score-60',
        name: 'Disciplined',
        emoji: '⭐',
        status: unlock(safeScore >= 60),
        desc: 'Hit a discipline score of 60+',
      },
      {
        id: 'score-85',
        name: 'Elite',
        emoji: '💎',
        status: unlock(safeScore >= 85),
        desc: 'Hit a discipline score of 85+',
      },
      {
        id: 'month-streak',
        name: 'Monthly Legend',
        emoji: '🏆',
        status: unlock(longestStreak >= 30),
        desc: 'Maintain a 30-day logging streak',
      },
    ]

    return ok({ badges })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
