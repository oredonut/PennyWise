// ============================================================
// Insights observation rule engine — pure, deterministic, no AI,
// no DB. The route computes aggregates and hands them here; this
// decides which observations fire, in priority order, with copy.
// ============================================================

import { numberWithCommas } from './format'

export type Observation = { id: string; emoji: string; text: string }

export type ObservationInput = {
  currentMonthTotal: number
  totalBudget: number
  /** Highest-spend merchant this month (by summed amount), or null. */
  topMerchant: { name: string; amount: number } | null
  /** Transport spend this month vs last month. */
  thisTransport: number
  lastTransport: number
  /** Current logging streak (days). */
  currentStreak: number
  /** Score change across this month's logs (last − first). */
  scoreDelta: number
  /** Category with the largest overspend this month, or null. */
  worstOver: { name: string; over: number } | null
}

/**
 * Returns up to 3 observations. Rules 1–4 are data-driven and evaluated in
 * priority order; rule 5 is a fallback appended only when fewer than 2
 * data-driven rules fired (so the card is never empty / barely populated).
 */
export function buildObservations(input: ObservationInput): Observation[] {
  const out: Observation[] = []

  // Rule 1 — a single merchant accounts for > 20% of total spend.
  if (input.topMerchant && input.currentMonthTotal > 0 && input.topMerchant.amount / input.currentMonthTotal > 0.2) {
    const pct = Math.round((input.topMerchant.amount / input.currentMonthTotal) * 100)
    out.push({
      id: 'rule-1',
      emoji: '🍗',
      text: `${input.topMerchant.name} took ₦${numberWithCommas(input.topMerchant.amount)} this month — that's ${pct}% of your total budget.`,
    })
  }

  // Rule 2 — transport spend dropped to < 70% of last month's.
  if (input.lastTransport > 0 && input.thisTransport < input.lastTransport * 0.7) {
    const pct = Math.round((1 - input.thisTransport / input.lastTransport) * 100)
    out.push({
      id: 'rule-2',
      emoji: '🚗',
      text: `Transport dropped ${pct}% vs last month. Either Bolt got expensive or you found your legs. Either way — ₦${numberWithCommas(input.lastTransport - input.thisTransport)} saved.`,
    })
  }

  // Rule 3 — a logging streak of at least 7 days.
  if (input.currentStreak >= 7) {
    out.push({
      id: 'rule-3',
      emoji: '🔥',
      text: `${input.currentStreak} days logged in a row. Your score climbed ${input.scoreDelta} points this month. That's actual discipline.`,
    })
  }

  // Rule 4 — a category over 100% of its budget (largest overspend).
  if (input.worstOver) {
    out.push({
      id: 'rule-4',
      emoji: '⚠️',
      text: `${input.worstOver.name} is ₦${numberWithCommas(input.worstOver.over)} over budget. That's the one to fix next month.`,
    })
  }

  // Rule 5 — fallback when fewer than 2 data-driven rules fired.
  if (out.length < 2) {
    out.push({
      id: 'rule-5',
      emoji: '📊',
      text: `₦${numberWithCommas(input.currentMonthTotal)} spent so far this month out of your ₦${numberWithCommas(input.totalBudget)} budget.`,
    })
  }

  return out.slice(0, 3)
}
