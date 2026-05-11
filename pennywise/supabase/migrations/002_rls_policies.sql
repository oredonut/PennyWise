-- Row Level Security: authenticated users only; row scope = auth.uid() matches owner column.
-- Trigger: mirror new auth.users into public.users (SECURITY DEFINER bypasses RLS as definer).

-- ---------------------------------------------------------------------------
-- Trigger: auto-create public.users on auth signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, COALESCE(NEW.email, ''), now());
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.merchant_map ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- public.users — owner column is id (same as auth.users id)
-- ---------------------------------------------------------------------------

CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY users_insert_own ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_delete_own ON public.users
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Tables keyed by user_id
-- ---------------------------------------------------------------------------

CREATE POLICY categories_select_own ON public.categories
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY categories_insert_own ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY categories_update_own ON public.categories
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY categories_delete_own ON public.categories
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY transactions_select_own ON public.transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY transactions_insert_own ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY transactions_update_own ON public.transactions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY transactions_delete_own ON public.transactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY recurring_rules_select_own ON public.recurring_rules
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY recurring_rules_insert_own ON public.recurring_rules
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recurring_rules_update_own ON public.recurring_rules
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recurring_rules_delete_own ON public.recurring_rules
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY daily_logs_select_own ON public.daily_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY daily_logs_insert_own ON public.daily_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY daily_logs_update_own ON public.daily_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY daily_logs_delete_own ON public.daily_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY streaks_select_own ON public.streaks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY streaks_insert_own ON public.streaks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY streaks_update_own ON public.streaks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY streaks_delete_own ON public.streaks
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY merchant_map_select_own ON public.merchant_map
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY merchant_map_insert_own ON public.merchant_map
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY merchant_map_update_own ON public.merchant_map
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY merchant_map_delete_own ON public.merchant_map
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- No anonymous access to app tables (policies are TO authenticated only)
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.users FROM anon;

REVOKE ALL ON TABLE public.categories FROM anon;

REVOKE ALL ON TABLE public.transactions FROM anon;

REVOKE ALL ON TABLE public.recurring_rules FROM anon;

REVOKE ALL ON TABLE public.daily_logs FROM anon;

REVOKE ALL ON TABLE public.streaks FROM anon;

REVOKE ALL ON TABLE public.merchant_map FROM anon;

REVOKE ALL ON TABLE public.users FROM PUBLIC;

REVOKE ALL ON TABLE public.categories FROM PUBLIC;

REVOKE ALL ON TABLE public.transactions FROM PUBLIC;

REVOKE ALL ON TABLE public.recurring_rules FROM PUBLIC;

REVOKE ALL ON TABLE public.daily_logs FROM PUBLIC;

REVOKE ALL ON TABLE public.streaks FROM PUBLIC;

REVOKE ALL ON TABLE public.merchant_map FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.recurring_rules TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.daily_logs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.streaks TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.merchant_map TO authenticated;
