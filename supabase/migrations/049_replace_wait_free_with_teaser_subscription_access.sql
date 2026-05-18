-- 049_replace_wait_free_with_teaser_subscription_access.sql
-- Replace the prototype wait-free mechanism with creator-controlled teaser access and subscription entitlement.

UPDATE episodes
SET pricing_type = 'paid'
WHERE pricing_type = 'wait_free';

DROP TABLE IF EXISTS wait_free_unlocks;

ALTER TABLE channels
  ADD COLUMN total_episodes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN work_scale TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN teaser_percentage INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN is_free_archive BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE channels
  ADD CONSTRAINT channels_total_episodes_check CHECK (total_episodes >= 0),
  ADD CONSTRAINT channels_work_scale_check CHECK (work_scale IN ('short', 'medium', 'long')),
  ADD CONSTRAINT channels_teaser_percentage_check CHECK (teaser_percentage >= 3 AND teaser_percentage <= 20);

UPDATE channels c
SET total_episodes = episode_counts.total_count
FROM (
  SELECT channel_id, count(*)::integer AS total_count
  FROM episodes
  GROUP BY channel_id
) episode_counts
WHERE episode_counts.channel_id = c.id;

CREATE OR REPLACE FUNCTION public.refresh_channel_total_episodes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel_ids UUID[];
  v_channel_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_channel_ids := ARRAY[NEW.channel_id];
  ELSIF TG_OP = 'DELETE' THEN
    v_channel_ids := ARRAY[OLD.channel_id];
  ELSE
    v_channel_ids := ARRAY(
      SELECT DISTINCT channel_id
      FROM (
        VALUES (NEW.channel_id), (OLD.channel_id)
      ) AS affected(channel_id)
      WHERE channel_id IS NOT NULL
    );
  END IF;

  FOREACH v_channel_id IN ARRAY v_channel_ids LOOP
    UPDATE channels
    SET
      total_episodes = (
        SELECT count(*)::integer
        FROM episodes e
        WHERE e.channel_id = v_channel_id
      ),
      updated_at = now()
    WHERE id = v_channel_id;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_channel_total_episodes ON episodes;
CREATE TRIGGER trg_refresh_channel_total_episodes
  AFTER INSERT OR UPDATE OF channel_id OR DELETE ON episodes
  FOR EACH ROW EXECUTE FUNCTION public.refresh_channel_total_episodes();

ALTER TABLE profiles
  ADD COLUMN is_subscribed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.check_dynamic_access(
  p_user_id UUID,
  p_webtoon_id UUID,
  p_episode_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel RECORD;
  v_episode RECORD;
  v_max_free_episode INTEGER;
  v_is_subscribed BOOLEAN := FALSE;
BEGIN
  SELECT
    id,
    status,
    total_episodes,
    teaser_percentage,
    is_free_archive
  INTO v_channel
  FROM channels
  WHERE id = p_webtoon_id
    AND work_type IN ('webtoon', 'novel');

  IF v_channel.id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'work_not_found',
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  SELECT
    id,
    channel_id,
    episode_number,
    status
  INTO v_episode
  FROM episodes
  WHERE id = p_episode_id
    AND channel_id = p_webtoon_id;

  IF v_episode.id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'episode_not_found',
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  IF v_channel.status NOT IN ('publishing', 'completed') OR v_episode.status <> 'published' THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'not_published',
      'episodeNumber', v_episode.episode_number,
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  v_max_free_episode := GREATEST(
    1,
    floor((GREATEST(v_channel.total_episodes, 0) * v_channel.teaser_percentage)::numeric / 100)::integer
  );

  IF v_channel.is_free_archive THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', 'free_archive',
      'episodeNumber', v_episode.episode_number,
      'maxFreeEpisode', v_max_free_episode,
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  IF v_episode.episode_number <= v_max_free_episode THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', 'teaser',
      'episodeNumber', v_episode.episode_number,
      'maxFreeEpisode', v_max_free_episode,
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  IF p_user_id IS NOT NULL THEN
    SELECT COALESCE(is_subscribed, FALSE)
    INTO v_is_subscribed
    FROM profiles
    WHERE id = p_user_id;
  END IF;

  IF v_is_subscribed THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', 'subscriber',
      'episodeNumber', v_episode.episode_number,
      'maxFreeEpisode', v_max_free_episode,
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', FALSE,
    'reason', 'subscription_required',
    'episodeNumber', v_episode.episode_number,
    'maxFreeEpisode', v_max_free_episode,
    'triggerSubscriptionPrompt', TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_dynamic_access(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_dynamic_access(UUID, UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_dynamic_access(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_dynamic_access(UUID, UUID, UUID) TO service_role;

ALTER TABLE channels
  DROP CONSTRAINT IF EXISTS chk_wait_free_hours,
  DROP COLUMN IF EXISTS wait_free_hours;

COMMENT ON COLUMN channels.total_episodes IS '현재 등록된 총 회차 수. episodes 변경 트리거로 갱신된다';
COMMENT ON COLUMN channels.work_scale IS '작품 규모: short, medium, long';
COMMENT ON COLUMN channels.teaser_percentage IS '작가가 설정한 무료 맛보기 비율. 3~20 사이';
COMMENT ON COLUMN channels.is_free_archive IS '작품 전체 무료 공개 여부';
COMMENT ON COLUMN profiles.is_subscribed IS '플랫폼 구독 접근권한 보유 여부';
COMMENT ON FUNCTION public.check_dynamic_access(UUID, UUID, UUID)
IS '작품별 맛보기 비율과 사용자 구독 상태를 기준으로 회차 접근 가능 여부를 반환한다';
