-- gen_random_uuid() is available on Supabase Postgres without extra extensions.

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  monthly_income numeric(12, 2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  monthly_budget numeric(12, 2) NOT NULL,
  color text,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  amount numeric(12, 2) NOT NULL,
  note text,
  source text CHECK (
    source IN ('manual', 'screenshot', 'sms', 'recurring')
  ),
  merchant_raw text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.recurring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL,
  note text,
  frequency text CHECK (frequency IN ('weekly', 'monthly')),
  next_fire_at timestamptz NOT NULL
);

CREATE TABLE public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  date date NOT NULL,
  discipline_score numeric(5, 2),
  total_spent numeric(12, 2),
  UNIQUE (user_id, date)
);

CREATE TABLE public.streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_logged_at timestamptz,
  UNIQUE (user_id)
);

CREATE TABLE public.merchant_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  merchant_keyword text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
  UNIQUE (user_id, merchant_keyword)
);

CREATE INDEX idx_transactions_user_created_at ON public.transactions (user_id, created_at);

CREATE INDEX idx_recurring_rules_next_fire_at ON public.recurring_rules (next_fire_at);
