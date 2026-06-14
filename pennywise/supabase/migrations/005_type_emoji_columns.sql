-- Persist transaction direction (expense/income) so the API no longer has to
-- infer it from category-name keywords at read time.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS type VARCHAR(10)
  DEFAULT 'expense'
  CHECK (type IN ('expense', 'income'));

-- emoji is presentation logic, handled client-side
-- via categoryEmoji() in lib/format.ts
