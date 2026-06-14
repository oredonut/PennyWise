import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/withRateLimit'
import { validate } from '@/lib/validate'

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

    const { data, error: dbError } = await supabase
      .from('users')
      .select('monthly_income')
      .eq('id', user.id)
      .maybeSingle()

    if (dbError) return err(dbError.message, 'db_error', 500)

    const parsed = Number(data?.monthly_income)
    const monthlyBudget = Number.isFinite(parsed) ? parsed : 0
    return ok({ monthlyBudget })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}

interface BudgetBody {
  monthlyBudget?: unknown
}

export async function PUT(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, 'standard')
    if (limited) return limited

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: BudgetBody
    try {
      body = (await request.json()) as BudgetBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const monthlyBudget = validate.number(body.monthlyBudget)
    if (monthlyBudget === null || monthlyBudget <= 0) {
      return err('monthlyBudget must be a positive number', 'invalid_input', 400)
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ monthly_income: String(monthlyBudget) })
      .eq('id', user.id)

    if (updateError) return err(updateError.message, 'db_error', 500)

    return ok({ monthlyBudget })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
