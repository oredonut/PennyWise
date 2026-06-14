-- Daily streak reminder at 20:00 UTC (21:00 WAT).
-- Requires pg_cron + pg_net (enabled in migration 003) and the service_role_key
-- stored in Vault. NOTE: numbered 008 because 007 is already taken on the remote
-- (007_revert_emoji_column); the task referenced "007" but that version is in use.

-- Remove a prior schedule so this migration re-applies cleanly.
DO
$$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT jobid FROM cron.job WHERE jobname = 'pennywise-daily-reminder'
  LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
END;
$$;

SELECT
  cron.schedule (
    'pennywise-daily-reminder',
    '0 20 * * *',
    $cron$
    SELECT
      net.http_post (
        url := 'https://sluhumgsvmcbbbrjcrzt.supabase.co/functions/v1/daily-reminder',
        headers := jsonb_build_object (
          'Content-Type',
          'application/json',
          'Authorization',
          'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
        ),
        body := '{}'::jsonb
      ) AS request_id;
$cron$);
