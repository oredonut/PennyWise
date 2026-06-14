-- Revert the categories.emoji column. Emoji is presentation logic handled
-- client-side via categoryEmoji() in lib/format.ts, so it does not belong in DB.
ALTER TABLE public.categories
  DROP COLUMN IF EXISTS emoji;
