-- BEFORE DEPLOY (required):
--   1. Replace <PROJECT_REF> in both URLs with your Supabase project ref
--      (pattern: https://<PROJECT_REF>.supabase.co/functions/v1/<function-name>).
--   2. Replace the Authorization value: either
--        - store the service role key in Supabase Vault (recommended), e.g.
--            select vault.create_secret('<your-service-role-key>', 'service_role_key');
--          then change the headers expression to:
--            'Authorization', 'Bearer ' || (select decrypted_secret
--              from vault.decrypted_secrets where name = 'service_role_key' limit 1)
--        - or substitute a real key for the literal '<SERVICE_ROLE_KEY>' below
--          (never commit real keys; use Vault or CI-injected SQL in production).
--
-- Extensions: pg_cron (scheduler), pg_net (async HTTP). Enable in the Dashboard
-- if your project requires it before this migration can apply.

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove prior schedules so this migration can be re-applied cleanly.
DO
$$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      jobid
    FROM
      cron.job
    WHERE
      jobname IN ('pennywise-fire-recurring-daily', 'pennywise-compute-daily-score-daily')
  LOOP
    PERFORM
      cron.unschedule(r.jobid);
  END LOOP;
END;
$$;

SELECT
  cron.schedule (
    'pennywise-fire-recurring-daily',
    '1 0 * * *',
    $cron$
    SELECT
      net.http_post (
        url := 'https://<PROJECT_REF>.supabase.co/functions/v1/fire-recurring',
        headers := jsonb_build_object (
          'Content-Type',
          'application/json',
          'Authorization',
          'Bearer <SERVICE_ROLE_KEY>'
        ),
        body := '{}'::jsonb
      ) AS request_id;
$cron$);

SELECT
  cron.schedule (
    'pennywise-compute-daily-score-daily',
    '55 23 * * *',
    $cron$
    SELECT
      net.http_post (
        url := 'https://<PROJECT_REF>.supabase.co/functions/v1/compute-daily-score',
        headers := jsonb_build_object (
          'Content-Type',
          'application/json',
          'Authorization',
          'Bearer <SERVICE_ROLE_KEY>'
        ),
        body := '{}'::jsonb
      ) AS request_id;
$cron$);
