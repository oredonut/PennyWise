// ─── SINGLE SOURCE OF TRUTH — Discipline Score math ──────────────────────────
// The actual scoring logic lives in supabase/functions/_shared/scoring.ts so the
// live recompute path (this app) and the nightly cron Edge Function
// (supabase/functions/compute-daily-score) share ONE implementation and cannot
// drift. This file is a thin re-export — do NOT add or duplicate scoring logic
// here. Edit the math in _shared/scoring.ts only.
export { clamp, computeDisciplineScore, computeBrokeScore } from '../../supabase/functions/_shared/scoring'
