-- Vanix: run in the TARGET Supabase SQL Editor as postgres. Back up existing projects first.
-- Creates schema, indexes and a new public business-media bucket; does not migrate existing data.
-- This is the combined copy of migrations 202610200001, 202610200002 and 202610220003.
-- Run once in Supabase SQL Editor (as postgres), or with node scripts/manage.mjs migrate.
-- Application-only schema: do not add app_private to Supabase's exposed schemas.
BEGIN;
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
SET LOCAL search_path = app_private, extensions, public;

DO $migration$
DECLARE entity text;
BEGIN
  FOREACH entity IN ARRAY ARRAY[
    'users','pages','links','link_clicks','services','appointments',
    'notifications','password_reset_tokens','phone_otps','login_attempts',
    'support_tickets','announcements'
  ] LOOP
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS app_private.%I (
         id text PRIMARY KEY,
         data jsonb NOT NULL CHECK (jsonb_typeof(data) = ''object'')
       )', entity);
    EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY', entity);
    EXECUTE format('REVOKE ALL ON app_private.%I FROM PUBLIC', entity);
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON app_private.%I ((data->''id'')) WHERE data ? ''id''', entity || '_document_id', entity);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON app_private.%I ((data->''user_id''))', entity || '_owner', entity);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON app_private.%I ((data->''created_at''))', entity || '_created', entity);
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA app_private FROM anon, authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM anon, authenticated;
  END IF;
END $migration$;

CREATE UNIQUE INDEX IF NOT EXISTS users_email ON app_private.users ((data->'email'));
CREATE UNIQUE INDEX IF NOT EXISTS pages_username ON app_private.pages ((data->'username'));
CREATE UNIQUE INDEX IF NOT EXISTS pages_one_per_owner ON app_private.pages ((data->'user_id'));
CREATE UNIQUE INDEX IF NOT EXISTS links_slug ON app_private.links ((data->'slug'));
CREATE UNIQUE INDEX IF NOT EXISTS login_attempts_identifier ON app_private.login_attempts ((data->'identifier'));
CREATE UNIQUE INDEX IF NOT EXISTS phone_otps_owner_unique ON app_private.phone_otps ((data->'user_id'));
CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_token ON app_private.password_reset_tokens ((data->'token'));
CREATE INDEX IF NOT EXISTS clicks_link_at ON app_private.link_clicks ((data->'link_id'), (data->'at'));
CREATE INDEX IF NOT EXISTS appointments_owner_date ON app_private.appointments ((data->'user_id'), (data->'date'), (data->'time'));
CREATE INDEX IF NOT EXISTS notifications_owner_unread ON app_private.notifications ((data->'user_id'), (data->'read'));

-- The database, not a preflight read alone, arbitrates concurrent bookings.
-- Existing overlapping active bookings must be reconciled before importing.
ALTER TABLE app_private.appointments
  ADD COLUMN IF NOT EXISTS owner_id text GENERATED ALWAYS AS (data->>'user_id') STORED,
  ADD COLUMN IF NOT EXISTS booking_date text GENERATED ALWAYS AS (data->>'date') STORED,
  ADD COLUMN IF NOT EXISTS slot int4range GENERATED ALWAYS AS (
    int4range(
      split_part(data->>'time', ':', 1)::integer * 60 + split_part(data->>'time', ':', 2)::integer,
      split_part(data->>'time', ':', 1)::integer * 60 + split_part(data->>'time', ':', 2)::integer
        + greatest(coalesce((data->>'duration_minutes')::integer, 30), 1) + greatest(coalesce((data->>'buffer_minutes')::integer, 0), 0),
      '[)'
    )
  ) STORED;
DO $constraint$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_no_overlap' AND conrelid = 'app_private.appointments'::regclass) THEN
    ALTER TABLE app_private.appointments ADD CONSTRAINT appointments_no_overlap
      EXCLUDE USING gist (owner_id WITH =, booking_date WITH =, slot WITH &&)
      WHERE ((data->>'status') IN ('pending', 'confirmed'));
  END IF;
END $constraint$;
COMMIT;

-- Business-page imagery is public. No anonymous/authenticated writes are granted.
-- Uploads are authorized by the authenticated Next.js API, using server-only keys.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-media', 'business-media', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;
COMMIT;

-- The Auth identity is separate from immutable application ownership IDs.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS users_supabase_auth_id
  ON app_private.users ((data->'supabase_auth_id'))
  WHERE data->>'supabase_auth_id' IS NOT NULL;
COMMIT;
