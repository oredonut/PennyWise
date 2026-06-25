// ─── SINGLE SOURCE OF TRUTH — Discipline Score math ──────────────────────────
// Imported by BOTH the live recompute path (Next.js: lib/scoring/recompute.ts via
// lib/scoring/compute.ts) AND the nightly cron Edge Function
// (supabase/functions/compute-daily-score/index.ts). Do NOT duplicate this logic
// anywhere else.
//
// This file lives under supabase/functions/_shared/ — not in lib/ — because the
// Supabase Edge Function bundler reliably bundles files inside supabase/functions/,
// whereas reaching out into the Next.js app dir (../../../lib/...) is not
// guaranteed across CLI versions. lib/scoring/compute.ts is a thin re-export of
// this file so the Next.js app shares the exact same implementation.
//
// Pure TypeScript, zero imports, no Deno or Node globals — safe to import from
// both the Deno runtime and the Next.js/Node/vitest runtime.

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

interface Category {
  spent: number
  budget: number
}

interface ScoreInput {
  totalSpent: number
  totalBudget: number
  streakDays: number
  categories: Category[]
}

export function computeDisciplineScore({
  totalSpent,
  totalBudget,
  streakDays,
  categories,
}: ScoreInput): number {
  const baseScore = clamp((1 - totalSpent / totalBudget) * 100, 0, 100)
  const streakMultiplier = 1 + Math.log(streakDays + 1) * 0.1
  const catConsistency =
    categories.length === 0
      ? 1
      : categories.filter((c) => c.spent < c.budget).length / categories.length
  return clamp(baseScore * streakMultiplier * catConsistency, 0, 100)
}

export function computeBrokeScore(disciplineScore: number): number {
  return 100 - disciplineScore
}
