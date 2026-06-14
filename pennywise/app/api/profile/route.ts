import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/withRateLimit'
import { gradeFromScore } from '@/lib/roast'
import { capitalizeFirst, monthName } from '@/lib/format'

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

    const today = new Date()
    const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
    const endOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1))

    const { data: logs, error: logsError } = await supabase
      .from('daily_logs')
      .select('discipline_score')
      .eq('user_id', user.id)
      .gte('date', startOfMonth.toISOString().slice(0, 10))
      .lt('date', endOfMonth.toISOString().slice(0, 10))

    if (logsError) return err(logsError.message, 'db_error', 500)

    const scores = (logs ?? []).map((l) => Number(l.discipline_score)).filter((n) => Number.isFinite(n))
    const avgScore = scores.length === 0 ? 50 : scores.reduce((s, n) => s + n, 0) / scores.length
    const grade = gradeFromScore(avgScore)

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
    const fullName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : ''
    const university = typeof metadata.university === 'string' ? metadata.university : null
    const emailPrefix = (user.email ?? '').split('@')[0] ?? ''
    const name = fullName || (emailPrefix ? capitalizeFirst(emailPrefix) : 'there')

    const created = user.created_at ? new Date(user.created_at) : today
    const memberSince = `${monthName(created.getUTCMonth())} ${created.getUTCFullYear()}`

    return ok({
      name,
      university,
      grade,
      gradeLabel: `Grade ${grade} Saver`,
      memberSince,
    })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
