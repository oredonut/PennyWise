import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

type Badge = {
  id: string
  name: string
  emoji: string
  status: 'Unlocked' | 'Locked'
  desc: string
}

// GET — a minimal, computed badge set. There is no badges table yet; this is a
// stopgap so the Profile tab renders instead of erroring. Badges are derived
// from data we already have (streak length + latest discipline score) — a
// streak-tier pair and a score-tier pair. NOT a real achievements system.
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const [streakResult, logResult] = await Promise.all([
      supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('daily_logs')
        .select('discipline_score')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (streakResult.error) return err(streakResult.error.message, 'db_error', 500)
    if (logResult.error) return err(logResult.error.message, 'db_error', 500)

    const bestStreak = Math.max(
      streakResult.data?.current_streak ?? 0,
      streakResult.data?.longest_streak ?? 0,
    )
    const rawScore =
      logResult.data?.discipline_score == null ? 0 : Number(logResult.data.discipline_score)
    const score = Number.isFinite(rawScore) ? rawScore : 0

    const unlocked = (cond: boolean): Badge['status'] => (cond ? 'Unlocked' : 'Locked')

    const badges: Badge[] = [
      {
        id: 'streak-7',
        name: 'Week Warrior',
        emoji: '🔥',
        desc: 'Keep a 7-day logging streak',
        status: unlocked(bestStreak >= 7),
      },
      {
        id: 'streak-30',
        name: 'Month Master',
        emoji: '📅',
        desc: 'Keep a 30-day logging streak',
        status: unlocked(bestStreak >= 30),
      },
      {
        id: 'score-60',
        name: 'Disciplined',
        emoji: '🎯',
        desc: 'Reach a 60+ discipline score',
        status: unlocked(score >= 60),
      },
      {
        id: 'score-80',
        name: 'Saver Elite',
        emoji: '💎',
        desc: 'Reach an 80+ discipline score',
        status: unlocked(score >= 80),
      },
    ]

    return ok({ badges })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
