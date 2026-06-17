-- User-editable transaction date. The mobile Add-Transaction sheet and the OCR
-- confirm flow let the user pick WHEN a spend happened (contract field
-- `occurredAt`), which is distinct from created_at (when the row was recorded).
-- Scoring/dashboard still bucket by created_at; occurred_at is the display date.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- One-time backfill: existing rows had no chosen date, so anchor occurred_at to
-- when they were recorded. (Migrations run once; new rows get the user's date.)
UPDATE public.transactions
  SET occurred_at = created_at
  WHERE occurred_at <> created_at;
