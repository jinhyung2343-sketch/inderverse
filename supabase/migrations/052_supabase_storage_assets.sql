-- Supabase Storage bucket for creator artwork assets.

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'artwork-assets',
  'artwork-assets',
  true,
  52428800,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'artwork_assets_public_read'
  ) THEN
    CREATE POLICY "artwork_assets_public_read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'artwork-assets');
  END IF;
END $$;
