--
-- The test user UUID below MUST exist in auth.users before
-- running this seed.  In a local Supabase environment you can
-- create it with:
--
--   supabase auth admin create-user \
--     --email test@pennywise.dev \
--     --password password123
--
-- Then replace the UUID below with the one that command prints,
-- or insert directly (local dev only):

DO $$
DECLARE
  v_user_id      uuid := '00000000-0000-0000-0000-000000000001';

  -- Category UUIDs
  v_cat_food     uuid := '00000000-0000-0000-0000-000000000010';
  v_cat_trans    uuid := '00000000-0000-0000-0000-000000000011';
  v_cat_data     uuid := '00000000-0000-0000-0000-000000000012';
  v_cat_leisure  uuid := '00000000-0000-0000-0000-000000000013';
  v_cat_misc     uuid := '00000000-0000-0000-0000-000000000014';
BEGIN

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  v_user_id,
  'test@pennywise.dev',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, monthly_income)
VALUES (v_user_id, 'test@pennywise.dev', 50000.00)
ON CONFLICT (id) DO NOTHING;

-- food 35%, transport 20%, data 15%, leisure 20%, misc 10%
INSERT INTO public.categories
  (id, user_id, name, monthly_budget, color, is_custom)
VALUES
  (v_cat_food,    v_user_id, 'food',      17500.00, '#F97316', false),
  (v_cat_trans,   v_user_id, 'transport', 10000.00, '#3B82F6', false),
  (v_cat_data,    v_user_id, 'data',       7500.00, '#8B5CF6', false),
  (v_cat_leisure, v_user_id, 'leisure',  10000.00, '#EC4899', false),
  (v_cat_misc,    v_user_id, 'misc',       5000.00, '#6B7280', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions
  (user_id, category_id, amount, note, source, merchant_raw, created_at)
VALUES
  (v_user_id, v_cat_food,    3500.00, NULL,              'manual', 'Shoprite',           now() - interval '12 days'),
  (v_user_id, v_cat_trans,   1200.00, 'to campus',       'manual', 'Uber',               now() - interval '12 days'),
  (v_user_id, v_cat_data,    2000.00, 'MTN 5GB',         'manual', 'MTN',                now() - interval '11 days'),
  (v_user_id, v_cat_food,    2800.00, NULL,              'manual', 'Chicken Republic',   now() - interval '10 days'),
  (v_user_id, v_cat_trans,    900.00, 'bolt to mall',    'manual', 'Bolt',               now() - interval '9 days'),
  (v_user_id, v_cat_leisure, 2900.00, 'monthly sub',     'manual', 'Netflix',            now() - interval '8 days'),
  (v_user_id, v_cat_food,    4200.00, 'weekly groceries','manual', 'Shoprite',           now() - interval '7 days'),
  (v_user_id, v_cat_trans,    500.00, NULL,              'manual', 'Danfo',              now() - interval '6 days'),
  (v_user_id, v_cat_food,    1500.00, NULL,              'manual', 'Shawarma spot',      now() - interval '5 days'),
  (v_user_id, v_cat_data,    1000.00, 'Airtel airtime',  'manual', 'Airtel',             now() - interval '4 days');

INSERT INTO public.recurring_rules
  (user_id, category_id, amount, note, frequency, next_fire_at)
VALUES
  (
    v_user_id,
    v_cat_misc,
    15000.00,
    'Monthly accommodation contribution',
    'monthly',
    date_trunc('month', now()) + interval '1 month'
  );

INSERT INTO public.daily_logs
  (user_id, date, discipline_score, total_spent)
VALUES
  (v_user_id, current_date - 6, 72.00,  4700.00),
  (v_user_id, current_date - 5, 75.50,  3400.00),
  (v_user_id, current_date - 4, 68.00,  5400.00),
  (v_user_id, current_date - 3, 78.25,  2900.00),
  (v_user_id, current_date - 2, 65.00,  6200.00),
  (v_user_id, current_date - 1, 80.00,  1500.00),
  (v_user_id, current_date,     83.50,  1000.00)
ON CONFLICT (user_id, date) DO UPDATE
  SET discipline_score = EXCLUDED.discipline_score,
      total_spent      = EXCLUDED.total_spent;

INSERT INTO public.streaks
  (user_id, current_streak, longest_streak, last_logged_at)
VALUES
  (v_user_id, 7, 7, now() - interval '1 hour')
ON CONFLICT (user_id) DO UPDATE
  SET current_streak  = EXCLUDED.current_streak,
      longest_streak  = EXCLUDED.longest_streak,
      last_logged_at  = EXCLUDED.last_logged_at;

END $$;
