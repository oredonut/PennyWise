import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUtcMonthRange } from '@/lib/time'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

type CategoryRow = {
  id: string
  name: string
  monthly_budget: string
  color: string | null
  is_custom: boolean
}

type TransactionSpendRow = {
  category_id: string | null
  amount: string
}

type CategoryResponseItem = {
  id: string
  name: string
  monthly_budget: number
  color: string | null
  is_custom: boolean
  spent_this_month: number
  pct_used: number
}

type CreateCategoryBody = {
  name?: unknown
  monthly_budget?: unknown
  color?: unknown
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : null
}

function buildCategoryResponse(
  category: CategoryRow,
  spentThisMonth: number
): CategoryResponseItem {
  const monthlyBudget = Number(category.monthly_budget)
  const pctUsed = monthlyBudget > 0 ? (spentThisMonth / monthlyBudget) * 100 : spentThisMonth > 0 ? 100 : 0

  return {
    id: category.id,
    name: category.name,
    monthly_budget: monthlyBudget,
    color: category.color,
    is_custom: category.is_custom,
    spent_this_month: spentThisMonth,
    pct_used: pctUsed,
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const { startIso, endIso } = getUtcMonthRange()

    const [categoriesResult, transactionsResult] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, monthly_budget, color, is_custom')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('user_id', user.id)
        .gte('created_at', startIso)
        .lt('created_at', endIso),
    ])

    if (categoriesResult.error) return err(categoriesResult.error.message, 'db_error', 500)
    if (transactionsResult.error) return err(transactionsResult.error.message, 'db_error', 500)

    const spentByCategory = new Map<string, number>()
    for (const transaction of transactionsResult.data ?? []) {
      if (!transaction.category_id) continue
      const amount = Number(transaction.amount)
      if (!Number.isFinite(amount)) continue
      spentByCategory.set(
        transaction.category_id,
        (spentByCategory.get(transaction.category_id) ?? 0) + amount
      )
    }

    const categories = (categoriesResult.data ?? []).map((category) =>
      buildCategoryResponse(category as CategoryRow, spentByCategory.get(category.id) ?? 0)
    )

    return ok({ categories })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: CreateCategoryBody
    try {
      body = (await request.json()) as CreateCategoryBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const monthlyBudget = toFiniteNumber(body.monthly_budget)
    const color = typeof body.color === 'string' && body.color.trim().length > 0 ? body.color.trim() : null

    if (!name || monthlyBudget === null || monthlyBudget < 0) {
      return err('name and monthly_budget are required', 'invalid_input', 400)
    }

    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name,
        monthly_budget: String(monthlyBudget),
        color,
        is_custom: true,
      })
      .select('id, name, monthly_budget, color, is_custom')
      .single()

    if (insertError) return err(insertError.message, 'db_error', 500)

    return ok(buildCategoryResponse(data as CategoryRow, 0))
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
