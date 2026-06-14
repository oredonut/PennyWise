-- Performance indexes for the hot read paths (dashboard, insights, history
-- pagination, recurring-rule firing). All IF NOT EXISTS so the migration is
-- idempotent and safe to re-apply.

-- Matches the keyset pagination order (created_at DESC) in GET /api/transactions.
CREATE INDEX IF NOT EXISTS idx_transactions_user_created
  ON public.transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date
  ON public.daily_logs(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_categories_user
  ON public.categories(user_id);

CREATE INDEX IF NOT EXISTS idx_streaks_user
  ON public.streaks(user_id);

CREATE INDEX IF NOT EXISTS idx_merchant_map_user
  ON public.merchant_map(user_id);

-- Partial index for the daily recurring-rules sweep.
CREATE INDEX IF NOT EXISTS idx_recurring_rules_next_fire
  ON public.recurring_rules(next_fire_at)
  WHERE next_fire_at IS NOT NULL;
