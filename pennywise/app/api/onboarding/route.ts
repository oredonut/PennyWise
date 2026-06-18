import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api-auth'
import { DEFAULT_BUDGET_RATIOS } from '@/lib/constants'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

interface OnboardingBody {
  monthly_income: number
  selected_categories: string[]
  custom_amounts?: Record<string, number>
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: OnboardingBody
    try {
      body = (await request.json()) as OnboardingBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    if (typeof body.monthly_income !== 'number' || !Array.isArray(body.selected_categories)) {
      return err('monthly_income and selected_categories are required', 'invalid_input', 400)
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ monthly_income: String(body.monthly_income) })
      .eq('id', user.id)

    if (userError) return err(userError.message, 'db_error', 500)

    const categories = body.selected_categories.map((name) => {
      const ratio =
        DEFAULT_BUDGET_RATIOS[name as keyof typeof DEFAULT_BUDGET_RATIOS] ??
        DEFAULT_BUDGET_RATIOS.misc
      const budget = body.custom_amounts?.[name] ?? body.monthly_income * ratio
      return {
        user_id: user.id,
        name,
        monthly_budget: String(budget),
      }
    })

    const { data, error: insertError } = await supabase
      .from('categories')
      .insert(categories)
      .select('id, name, monthly_budget, color, is_custom, created_at')

    if (insertError) return err(insertError.message, 'db_error', 500)
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
