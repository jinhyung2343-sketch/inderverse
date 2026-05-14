-- 039_upload_pipeline_recovery_hardening.sql
-- 업로드/정리 백그라운드 작업의 중단 복구와 정리 큐 재등록 보강

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
    WHERE attempt_count < 5
      AND (
        status IN ('queued', 'failed')
        OR (
          status = 'processing'
          AND updated_at < NOW() - INTERVAL '30 minutes'
        )
      )
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
    WHERE original_file_path IS NOT NULL
      AND processing_attempt_count < 5
      AND (
        processing_status IN ('partial', 'retry_needed')
        OR (
          processing_status = 'processing'
          AND processing_last_attempt_at < NOW() - INTERVAL '30 minutes'
        )
      )
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
    reason,
    status,
    last_error,
    updated_at
  )
  SELECT
    file_path,
    'episode_images',
    p_episode_id,
    'webtoon_episode_image_replaced',
    'queued',
    NULL,
    NOW()
  FROM stale_paths
  ON CONFLICT (file_path) DO UPDATE
  SET
    source_table = EXCLUDED.source_table,
    source_id = EXCLUDED.source_id,
    reason = EXCLUDED.reason,
    status = CASE
      WHEN storage_cleanup_jobs.status IN ('completed', 'ignored', 'failed') THEN 'queued'
      ELSE storage_cleanup_jobs.status
    END,
    attempt_count = CASE
      WHEN storage_cleanup_jobs.status IN ('completed', 'ignored', 'failed') THEN 0
      ELSE storage_cleanup_jobs.attempt_count
    END,
    last_error = NULL,
    updated_at = NOW();

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
