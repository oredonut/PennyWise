import { computeDisciplineScore } from './compute'
import { sendPush } from '@/lib/push'
import type { createClient } from '@/lib/supabase/server'

type DbClient = Awaited<ReturnType<typeof createClient>>

/**
 * Recompute today's discipline score and upsert the daily log. Optionally pass
 * the amounts just added per category (keyed by category id) so we can detect a
 * category crossing the 75% budget threshold on THIS write and fire a one-time
 * push alert.
 */
export async function recomputeTodayScore(
  supabase: DbClient,
  userId: string,
  addedByCategory: Record<string, number> = {},
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 7)}-01T00:00:00Z`

  const [{ data: cats }, { data: txns }, { data: streak }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, monthly_budget')
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

  // ── Budget alert: notify when a category crosses 75% on this write ──
  // Best-effort — an alert failure must never affect the score recompute.
  try {
    const crossed = cats.filter((c) => {
      const budget = parseFloat(c.monthly_budget)
      if (!(budget > 0)) return false
      const newSpent = spentByCategory.get(c.id) ?? 0
      const oldSpent = newSpent - (addedByCategory[c.id] ?? 0)
      const newPct = (newSpent / budget) * 100
      const oldPct = (oldSpent / budget) * 100
      return newPct >= 75 && newPct < 100 && oldPct < 75
    })

    if (crossed.length > 0) {
      const { data: userRow } = await supabase
        .from('users')
        .select('push_token')
        .eq('id', userId)
        .maybeSingle()
      const token = userRow?.push_token
      if (token) {
        for (const c of crossed) {
          await sendPush(
            token,
            'Budget alert 🚨',
            `You've used 75% of your ${c.name} budget`,
            { route: 'Insights' },
          )
        }
      }
    }
  } catch {
    // ignore — alerts are best-effort
  }
}
