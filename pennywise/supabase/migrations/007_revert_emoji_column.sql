-- Revert the categories.emoji column. Emoji is presentation logic and is
-- handled client-side via categoryEmoji() in lib/format.ts, so it does not
-- belong in the database.
ALTER TABLE public.categories
  DROP COLUMN IF EXISTS emoji;
