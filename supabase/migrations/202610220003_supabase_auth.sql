-- The Auth identity is separate from immutable application ownership IDs.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS users_supabase_auth_id
  ON app_private.users ((data->'supabase_auth_id'))
  WHERE data->>'supabase_auth_id' IS NOT NULL;
COMMIT;
