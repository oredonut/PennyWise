-- Persist transaction direction (expense/income) and a per-category emoji so the
-- API no longer has to infer them from category-name keywords at read time.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS type VARCHAR(10)
  DEFAULT 'expense'
  CHECK (type IN ('expense', 'income'));

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS emoji VARCHAR(10)
  DEFAULT '💳';

-- Backfill existing categories from their names (mirrors lib/format.ts EMOJI_MAP).
UPDATE public.categories SET emoji = CASE
  WHEN lower(name) LIKE '%food%'      THEN '🍛'
  WHEN lower(name) LIKE '%transport%' THEN '🚌'
  WHEN lower(name) LIKE '%data%'      THEN '📱'
  WHEN lower(name) LIKE '%airtime%'   THEN '📱'
  WHEN lower(name) LIKE '%leisure%'   THEN '🎲'
  WHEN lower(name) LIKE '%fun%'       THEN '🎲'
  WHEN lower(name) LIKE '%hangout%'   THEN '🎲'
  WHEN lower(name) LIKE '%groceries%' THEN '🛒'
  WHEN lower(name) LIKE '%rent%'      THEN '🏠'
  WHEN lower(name) LIKE '%saving%'    THEN '💰'
  WHEN lower(name) LIKE '%subscri%'   THEN '📺'
  WHEN lower(name) LIKE '%school%'    THEN '📚'
  ELSE '💳'
END;
