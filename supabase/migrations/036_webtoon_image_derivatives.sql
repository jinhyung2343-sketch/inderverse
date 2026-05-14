-- 036_webtoon_image_derivatives.sql
-- 웹툰 원본 보존 + 독자용/썸네일 파생 이미지 메타데이터

ALTER TABLE episode_images
  ADD COLUMN IF NOT EXISTS original_image_url TEXT,
  ADD COLUMN IF NOT EXISTS optimized_image_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_image_url TEXT,
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS derivatives JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE episode_images
SET original_image_url = COALESCE(original_image_url, image_url)
WHERE original_image_url IS NULL;

COMMENT ON COLUMN episode_images.image_url IS '독자 뷰어에서 우선 사용하는 이미지 URL. 최적화본이 있으면 optimized_image_url과 동일하게 저장';
COMMENT ON COLUMN episode_images.original_image_url IS '작가가 업로드한 원본 이미지 URL';
COMMENT ON COLUMN episode_images.optimized_image_url IS '독자용으로 리사이즈/압축한 WebP 이미지 URL';
COMMENT ON COLUMN episode_images.thumbnail_image_url IS '목록/관리 화면용 썸네일 WebP 이미지 URL';
COMMENT ON COLUMN episode_images.derivatives IS '원본/최적화/썸네일 이미지의 width, height, size, format 등 파생 메타데이터';

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

  DELETE FROM episode_images
  WHERE episode_id = p_episode_id;

  IF jsonb_typeof(COALESCE(p_images, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Images payload must be a JSON array';
  END IF;

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
    is_verified
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
    is_verified
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
    is_verified BOOLEAN
  )
  WHERE image_url IS NOT NULL
    AND length(trim(image_url)) > 0;

  RETURN jsonb_build_object(
    'status', 'success',
    'episode_id', p_episode_id
  );
END;
$$;
