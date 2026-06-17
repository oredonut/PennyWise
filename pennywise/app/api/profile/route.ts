import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gradeFromScore } from '@/lib/roast'
import { capitalizeFirst, monthName } from '@/lib/format'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

export async function GET() {
  try {
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

// PATCH — landing spot for the Profile Setup screen (post-OTP). Request uses the
// camelCase contract convention; fields map to two stores:
//   fullName, university → auth user_metadata (where GET above reads them)
//   monthlyBudget        → public.users.monthly_income (the only numeric budget
//                          column on users; there is no users.monthly_budget)
// All three are optional so the screen can submit a partial edit.
interface ProfilePatchBody {
  fullName?: unknown
  university?: unknown
  monthlyBudget?: unknown
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: ProfilePatchBody
    try {
      body = (await request.json()) as ProfilePatchBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    // ── Validate + collect user_metadata changes ──
    const metadataUpdate: Record<string, unknown> = {}
    if (body.fullName !== undefined) {
      if (typeof body.fullName !== 'string' || !body.fullName.trim()) {
        return err('fullName must be a non-empty string', 'invalid_input', 400)
      }
      metadataUpdate.full_name = body.fullName.trim()
    }
    if (body.university !== undefined) {
      if (body.university !== null && typeof body.university !== 'string') {
        return err('university must be a string or null', 'invalid_input', 400)
      }
      metadataUpdate.university =
        body.university === null ? null : (body.university as string).trim()
    }

    // ── Validate the budget (→ monthly_income column) ──
    let monthlyIncome: number | undefined
    if (body.monthlyBudget !== undefined) {
      if (
        typeof body.monthlyBudget !== 'number' ||
        !Number.isFinite(body.monthlyBudget) ||
        body.monthlyBudget < 0
      ) {
        return err('monthlyBudget must be a non-negative number', 'invalid_input', 400)
      }
      monthlyIncome = body.monthlyBudget
    }

    if (Object.keys(metadataUpdate).length === 0 && monthlyIncome === undefined) {
      return err(
        'Nothing to update — provide fullName, university, or monthlyBudget',
        'invalid_input',
        400,
      )
    }

    // user_metadata (full_name/university) — GoTrue merges these top-level keys.
    if (Object.keys(metadataUpdate).length > 0) {
      const { error: metaError } = await supabase.auth.updateUser({ data: metadataUpdate })
      if (metaError) return err(metaError.message, 'auth_error', 500)
    }

    // Budget → users.monthly_income (numeric stored as string, like elsewhere).
    if (monthlyIncome !== undefined) {
      const { error: dbError } = await supabase
        .from('users')
        .update({ monthly_income: String(monthlyIncome) })
        .eq('id', user.id)
      if (dbError) return err(dbError.message, 'db_error', 500)
    }

    // Echo the saved values (camelCase) so the screen can confirm without a GET.
    const meta = { ...(user.user_metadata ?? {}), ...metadataUpdate } as Record<string, unknown>
    return ok({
      name: typeof meta.full_name === 'string' ? meta.full_name : null,
      university: (meta.university ?? null) as string | null,
      monthlyBudget: monthlyIncome ?? null,
    })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
