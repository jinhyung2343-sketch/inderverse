-- 031_update_webtoon_episode_rpc.sql
-- 웹툰 회차 메타데이터 수정과 이미지 교체를 하나의 트랜잭션으로 처리한다.

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
    sort_order
  )
  SELECT
    p_episode_id,
    image_url,
    sort_order
  FROM jsonb_to_recordset(COALESCE(p_images, '[]'::jsonb)) AS x(
    image_url TEXT,
    sort_order INT
  )
  WHERE image_url IS NOT NULL
    AND length(trim(image_url)) > 0;

  RETURN jsonb_build_object(
    'status', 'success',
    'episode_id', p_episode_id
  );
END;
$$;
