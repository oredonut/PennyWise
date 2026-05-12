import { computeDisciplineScore } from './compute'
import type { createClient } from '@/lib/supabase/server'

type DbClient = Awaited<ReturnType<typeof createClient>>

export async function recomputeTodayScore(supabase: DbClient, userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 7)}-01T00:00:00Z`

  const [{ data: cats }, { data: txns }, { data: streak }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, monthly_budget')
      .eq('user_id', userId),
    supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', userId)
      .gte('created_at', monthStart),
    supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (!cats || cats.length === 0) return

  const totalBudget = cats.reduce((sum, c) => sum + parseFloat(c.monthly_budget), 0)
  if (totalBudget === 0) return

  const spentByCategory = new Map<string, number>()
  for (const txn of txns ?? []) {
    if (txn.category_id) {
      spentByCategory.set(
        txn.category_id,
        (spentByCategory.get(txn.category_id) ?? 0) + parseFloat(txn.amount),
      )
    }
  }

  const totalSpent = Array.from(spentByCategory.values()).reduce((a, b) => a + b, 0)
  const categories = cats.map((c) => ({
    spent: spentByCategory.get(c.id) ?? 0,
    budget: parseFloat(c.monthly_budget),
  }))

  const disciplineScore = computeDisciplineScore({
    totalSpent,
    totalBudget,
    streakDays: streak?.current_streak ?? 0,
    categories,
  })

  await supabase.from('daily_logs').upsert(
    {
      user_id: userId,
      date: today,
      discipline_score: String(disciplineScore),
      total_spent: String(totalSpent),
    },
    { onConflict: 'user_id,date' },
  )
}
