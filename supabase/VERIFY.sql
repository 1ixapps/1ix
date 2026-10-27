-- Read-only checks after SETUP.sql or npm run db:migrate. Never prints user data or keys.
-- Expect 12 rows, rls_enabled=true, anon_read=false, authenticated_read=false.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_read,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_read
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='app_private' AND c.relkind='r' ORDER BY c.relname;

-- Expect schema access to be false for both public API roles.
SELECT has_schema_privilege('anon','app_private','USAGE') AS anon_schema_access,
       has_schema_privilege('authenticated','app_private','USAGE') AS authenticated_schema_access;

-- Expect one validated appointments_no_overlap exclusion constraint.
SELECT conname, contype, convalidated FROM pg_constraint
WHERE conrelid='app_private.appointments'::regclass AND conname='appointments_no_overlap';

-- Expect the unique Supabase identity index to exist.
SELECT indexname FROM pg_indexes WHERE schemaname='app_private' AND indexname='users_supabase_auth_id';

-- Expect business-media, public=true, limit=5242880, approved image MIME types.
-- If an EXISTING private bucket has this name, do NOT make its private files public.
SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id='business-media';

-- Counts only, useful for comparing a source and restored target project.
SELECT 'users' AS entity, count(*) FROM app_private.users
UNION ALL SELECT 'pages', count(*) FROM app_private.pages
UNION ALL SELECT 'links', count(*) FROM app_private.links
UNION ALL SELECT 'services', count(*) FROM app_private.services
UNION ALL SELECT 'appointments', count(*) FROM app_private.appointments;
