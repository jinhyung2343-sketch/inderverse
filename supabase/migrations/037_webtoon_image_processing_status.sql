-- 037_webtoon_image_processing_status.sql
-- 웹툰 이미지 변환 상태, 실패 사유, 정리 후보 추적

ALTER TABLE episode_images
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS cleanup_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS original_file_path TEXT,
  ADD COLUMN IF NOT EXISTS optimized_file_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_file_path TEXT;

ALTER TABLE episode_images
  DROP CONSTRAINT IF EXISTS chk_episode_images_processing_status,
  ADD CONSTRAINT chk_episode_images_processing_status CHECK (
    processing_status IN ('pending', 'processing', 'ready', 'partial', 'failed', 'retry_needed')
  );

ALTER TABLE episode_images
  DROP CONSTRAINT IF EXISTS chk_episode_images_cleanup_status,
  ADD CONSTRAINT chk_episode_images_cleanup_status CHECK (
    cleanup_status IN ('active', 'orphan_candidate', 'deleted')
  );

UPDATE episode_images
SET
  processing_status = COALESCE(processing_status, 'ready'),
  cleanup_status = COALESCE(cleanup_status, 'active');

COMMENT ON COLUMN episode_images.processing_status IS '이미지 변환 상태. ready=원본/파생 이미지 준비 완료, partial=원본 fallback, retry_needed=재처리 필요';
COMMENT ON COLUMN episode_images.processing_error IS '이미지 변환 또는 파생 파일 생성 실패 사유';
COMMENT ON COLUMN episode_images.cleanup_status IS 'Supabase Storage 파일 정리 상태. 삭제/교체 후 고아 파일 추적에 사용';
COMMENT ON COLUMN episode_images.original_file_path IS 'Supabase Storage 원본 파일 경로';
COMMENT ON COLUMN episode_images.optimized_file_path IS 'Supabase Storage 독자용 최적화 파일 경로';
COMMENT ON COLUMN episode_images.thumbnail_file_path IS 'Supabase Storage 썸네일 파일 경로';

CREATE TABLE IF NOT EXISTS storage_cleanup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL UNIQUE,
  source_table TEXT NOT NULL,
  source_id UUID,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_storage_cleanup_jobs_status CHECK (
    status IN ('queued', 'processing', 'completed', 'failed', 'ignored')
  )
);

CREATE INDEX IF NOT EXISTS idx_storage_cleanup_jobs_status_created_at
  ON storage_cleanup_jobs(status, created_at);

COMMENT ON TABLE storage_cleanup_jobs IS '업로드 교체/삭제로 더 이상 참조하지 않는 Supabase Storage 파일 정리 대기열';
COMMENT ON COLUMN storage_cleanup_jobs.file_path IS 'Supabase Storage 파일 경로. 실제 삭제 전 공개 URL 대신 경로 기준으로 처리';

CREATE OR REPLACE FUNCTION public.claim_storage_cleanup_jobs(
  p_limit INT DEFAULT 25
)
RETURNS SETOF storage_cleanup_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INT;
BEGIN
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100);

  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM storage_cleanup_jobs
    WHERE status IN ('queued', 'failed')
      AND attempt_count < 5
    ORDER BY created_at ASC
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE storage_cleanup_jobs jobs
  SET
    status = 'processing',
    attempt_count = jobs.attempt_count + 1,
    last_error = NULL,
    updated_at = NOW()
  FROM candidates
  WHERE jobs.id = candidates.id
  RETURNING jobs.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_storage_file_referenced(
  p_file_path TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM episode_images
    WHERE original_file_path = p_file_path
      OR optimized_file_path = p_file_path
      OR thumbnail_file_path = p_file_path
  );
$$;

CREATE OR REPLACE FUNCTION public.complete_storage_cleanup_job(
  p_job_id UUID,
  p_status TEXT,
  p_error TEXT DEFAULT NULL
)
RETURNS storage_cleanup_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job storage_cleanup_jobs;
BEGIN
  IF p_status NOT IN ('completed', 'failed', 'ignored') THEN
    RAISE EXCEPTION 'Invalid cleanup job status';
  END IF;

  UPDATE storage_cleanup_jobs
  SET
    status = p_status,
    last_error = NULLIF(p_error, ''),
    updated_at = NOW()
  WHERE id = p_job_id
  RETURNING *
  INTO v_job;

  IF v_job.id IS NULL THEN
    RAISE EXCEPTION 'Cleanup job not found';
  END IF;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_webtoon_episode_with_images(
  p_user_id UUID,
  p_channel_id UUID,
  p_episode_id UUID,
  p_episode_number INT,
  p_title TEXT,
  p_pricing_type episode_pricing,
  p_coin_price INT,
  p_is_adult_only BOOLEAN,
  p_status episode_status,
  p_published_at TIMESTAMPTZ,
  p_images JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owned_channel_id UUID;
  v_existing_episode_id UUID;
BEGIN
  SELECT c.id
  INTO v_owned_channel_id
  FROM channels c
  WHERE c.id = p_channel_id
    AND c.creator_id = p_user_id
    AND c.work_type = 'webtoon';

  IF v_owned_channel_id IS NULL THEN
    RAISE EXCEPTION 'You can only update episodes in your own webtoon channels';
  END IF;

  SELECT e.id
  INTO v_existing_episode_id
  FROM episodes e
  WHERE e.id = p_episode_id
    AND e.channel_id = p_channel_id
  FOR UPDATE;

  IF v_existing_episode_id IS NULL THEN
    RAISE EXCEPTION 'Episode not found';
  END IF;

  UPDATE episodes
  SET
    episode_number = p_episode_number,
    title = p_title,
    pricing_type = p_pricing_type,
    coin_price = p_coin_price,
    is_adult_only = p_is_adult_only,
    status = p_status,
    published_at = p_published_at
  WHERE id = p_episode_id
    AND channel_id = p_channel_id;

  IF jsonb_typeof(COALESCE(p_images, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Images payload must be a JSON array';
  END IF;

  WITH incoming_paths AS (
    SELECT DISTINCT NULLIF(trim(path), '') AS file_path
    FROM jsonb_to_recordset(COALESCE(p_images, '[]'::jsonb)) AS x(
      original_file_path TEXT,
      optimized_file_path TEXT,
      thumbnail_file_path TEXT
    )
    CROSS JOIN LATERAL (
      VALUES (x.original_file_path), (x.optimized_file_path), (x.thumbnail_file_path)
    ) AS paths(path)
    WHERE NULLIF(trim(path), '') IS NOT NULL
  ),
  existing_paths AS (
    SELECT DISTINCT NULLIF(trim(path), '') AS file_path
    FROM episode_images ei
    CROSS JOIN LATERAL (
      VALUES (ei.original_file_path), (ei.optimized_file_path), (ei.thumbnail_file_path)
    ) AS paths(path)
    WHERE ei.episode_id = p_episode_id
      AND NULLIF(trim(path), '') IS NOT NULL
  ),
  stale_paths AS (
    SELECT existing_paths.file_path
    FROM existing_paths
    LEFT JOIN incoming_paths ON incoming_paths.file_path = existing_paths.file_path
    WHERE incoming_paths.file_path IS NULL
  )
  INSERT INTO storage_cleanup_jobs (
    file_path,
    source_table,
    source_id,
    reason
  )
  SELECT
    file_path,
    'episode_images',
    p_episode_id,
    'webtoon_episode_image_replaced'
  FROM stale_paths
  ON CONFLICT (file_path) DO NOTHING;

  DELETE FROM episode_images
  WHERE episode_id = p_episode_id;

  INSERT INTO episode_images (
    episode_id,
    image_url,
    original_image_url,
    optimized_image_url,
    thumbnail_image_url,
    sort_order,
    width,
    height,
    file_size_bytes,
    content_type,
    derivatives,
    is_verified,
    processing_status,
    processing_error,
    cleanup_status,
    original_file_path,
    optimized_file_path,
    thumbnail_file_path
  )
  SELECT
    p_episode_id,
    COALESCE(NULLIF(optimized_image_url, ''), image_url),
    COALESCE(NULLIF(original_image_url, ''), image_url),
    NULLIF(optimized_image_url, ''),
    NULLIF(thumbnail_image_url, ''),
    sort_order,
    width,
    height,
    file_size_bytes,
    NULLIF(content_type, ''),
    COALESCE(derivatives, '{}'::jsonb),
    COALESCE(is_verified, FALSE),
    COALESCE(NULLIF(processing_status, ''), 'ready'),
    NULLIF(processing_error, ''),
    COALESCE(NULLIF(cleanup_status, ''), 'active'),
    NULLIF(original_file_path, ''),
    NULLIF(optimized_file_path, ''),
    NULLIF(thumbnail_file_path, '')
  FROM jsonb_to_recordset(COALESCE(p_images, '[]'::jsonb)) AS x(
    image_url TEXT,
    original_image_url TEXT,
    optimized_image_url TEXT,
    thumbnail_image_url TEXT,
    sort_order INT,
    width INT,
    height INT,
    file_size_bytes INT,
    content_type TEXT,
    derivatives JSONB,
    is_verified BOOLEAN,
    processing_status TEXT,
    processing_error TEXT,
    cleanup_status TEXT,
    original_file_path TEXT,
    optimized_file_path TEXT,
    thumbnail_file_path TEXT
  )
  WHERE image_url IS NOT NULL
    AND length(trim(image_url)) > 0;

  RETURN jsonb_build_object(
    'status', 'success',
    'episode_id', p_episode_id
  );
END;
$$;
