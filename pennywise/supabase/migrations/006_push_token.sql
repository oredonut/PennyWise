-- Store the device push notification token on the user row.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS push_token TEXT;
