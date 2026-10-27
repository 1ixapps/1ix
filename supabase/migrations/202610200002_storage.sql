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
