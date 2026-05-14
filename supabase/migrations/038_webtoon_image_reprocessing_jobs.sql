-- 038_webtoon_image_reprocessing_jobs.sql
-- partial/retry_needed 웹툰 이미지 파생본 자동 재처리

ALTER TABLE episode_images
  ADD COLUMN IF NOT EXISTS processing_attempt_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_last_attempt_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_episode_images_processing_retry
  ON episode_images(processing_status, processing_attempt_count, processing_last_attempt_at)
  WHERE original_file_path IS NOT NULL;

COMMENT ON COLUMN episode_images.processing_attempt_count IS '이미지 파생본 재처리 시도 횟수';
COMMENT ON COLUMN episode_images.processing_last_attempt_at IS '이미지 파생본 마지막 재처리 시각';

CREATE OR REPLACE FUNCTION public.claim_webtoon_image_processing_jobs(
  p_limit INT DEFAULT 10
)
RETURNS SETOF episode_images
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INT;
BEGIN
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);

  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM episode_images
    WHERE processing_status IN ('partial', 'retry_needed')
      AND original_file_path IS NOT NULL
      AND processing_attempt_count < 5
    ORDER BY processing_last_attempt_at ASC NULLS FIRST, id ASC
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE episode_images images
  SET
    processing_status = 'processing',
    processing_error = NULL,
    processing_attempt_count = images.processing_attempt_count + 1,
    processing_last_attempt_at = NOW()
  FROM candidates
  WHERE images.id = candidates.id
  RETURNING images.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_webtoon_image_processing_job(
  p_image_id UUID,
  p_status TEXT,
  p_error TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_optimized_image_url TEXT DEFAULT NULL,
  p_thumbnail_image_url TEXT DEFAULT NULL,
  p_width INT DEFAULT NULL,
  p_height INT DEFAULT NULL,
  p_file_size_bytes INT DEFAULT NULL,
  p_content_type TEXT DEFAULT NULL,
  p_derivatives JSONB DEFAULT NULL,
  p_optimized_file_path TEXT DEFAULT NULL,
  p_thumbnail_file_path TEXT DEFAULT NULL
)
RETURNS episode_images
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_image episode_images;
BEGIN
  IF p_status NOT IN ('ready', 'retry_needed', 'failed') THEN
    RAISE EXCEPTION 'Invalid webtoon image processing status';
  END IF;

  UPDATE episode_images
  SET
    image_url = CASE
      WHEN p_status = 'ready' THEN COALESCE(NULLIF(p_image_url, ''), image_url)
      ELSE image_url
    END,
    optimized_image_url = CASE
      WHEN p_status = 'ready' THEN NULLIF(p_optimized_image_url, '')
      ELSE optimized_image_url
    END,
    thumbnail_image_url = CASE
      WHEN p_status = 'ready' THEN NULLIF(p_thumbnail_image_url, '')
      ELSE thumbnail_image_url
    END,
    width = COALESCE(p_width, width),
    height = COALESCE(p_height, height),
    file_size_bytes = COALESCE(p_file_size_bytes, file_size_bytes),
    content_type = COALESCE(NULLIF(p_content_type, ''), content_type),
    derivatives = CASE
      WHEN p_status = 'ready' THEN COALESCE(p_derivatives, derivatives)
      ELSE derivatives
    END,
    optimized_file_path = CASE
      WHEN p_status = 'ready' THEN NULLIF(p_optimized_file_path, '')
      ELSE optimized_file_path
    END,
    thumbnail_file_path = CASE
      WHEN p_status = 'ready' THEN NULLIF(p_thumbnail_file_path, '')
      ELSE thumbnail_file_path
    END,
    processing_status = p_status,
    processing_error = NULLIF(p_error, '')
  WHERE id = p_image_id
  RETURNING *
  INTO v_image;

  IF v_image.id IS NULL THEN
    RAISE EXCEPTION 'Episode image not found';
  END IF;

  RETURN v_image;
END;
$$;
