import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_BUDGET_RATIOS } from '@/lib/constants'
import { applyRateLimit } from '@/lib/withRateLimit'
import { validate } from '@/lib/validate'

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
    const limited = applyRateLimit(request, 'standard')
    if (limited) return limited

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: OnboardingBody
    try {
      body = (await request.json()) as OnboardingBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const monthlyIncome = validate.number(body.monthly_income)
    if (
      monthlyIncome === null ||
      monthlyIncome <= 0 ||
      !Array.isArray(body.selected_categories) ||
      body.selected_categories.length < 1 ||
      body.selected_categories.length > 50
    ) {
      return err(
        'monthly_income (positive) and 1–50 selected_categories are required',
        'invalid_input',
        400
      )
    }

    const selectedCategories: string[] = []
    for (const candidate of body.selected_categories) {
      const name = validate.string(candidate, 100)
      if (!name) {
        return err('each selected category must be a non-empty string (max 100)', 'invalid_input', 400)
      }
      selectedCategories.push(name)
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ monthly_income: String(monthlyIncome) })
      .eq('id', user.id)

    if (userError) return err(userError.message, 'db_error', 500)

    const categories = selectedCategories.map((name) => {
      const ratio =
        DEFAULT_BUDGET_RATIOS[name as keyof typeof DEFAULT_BUDGET_RATIOS] ??
        DEFAULT_BUDGET_RATIOS.misc
      const custom = validate.number(body.custom_amounts?.[name])
      const budget = custom ?? monthlyIncome * ratio
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
