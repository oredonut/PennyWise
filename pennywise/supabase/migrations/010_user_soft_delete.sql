-- ============================================================
-- 010_user_soft_delete.sql
--
-- Adds a soft-delete flag to public.users. Set by DELETE /api/account.
-- NULL = active account; a timestamp = the user requested deletion.
--
-- KNOWN GAP (pre-launch, intentional for now): nothing yet blocks a
-- soft-deleted user from signing back in — no middleware checks deleted_at.
-- This column only records intent; enforcement on login is a follow-up.
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
