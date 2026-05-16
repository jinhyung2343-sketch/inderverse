-- Keep public navigation queries on indexed paths for production traffic.

CREATE INDEX IF NOT EXISTS idx_channels_public_artwork_feed
  ON public.channels (work_type, status, is_adult_only, updated_at DESC)
  WHERE work_type IN ('webtoon', 'novel');

CREATE INDEX IF NOT EXISTS idx_channels_public_spark_feed
  ON public.channels (status, is_adult_only, updated_at DESC)
  WHERE work_type = 'spark';

CREATE INDEX IF NOT EXISTS idx_channels_creator_public_feed
  ON public.channels (creator_id, work_type, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_channels_creator_channel_public_feed
  ON public.channels (creator_channel_id, work_type, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_episodes_public_feed
  ON public.episodes (channel_id, is_adult_only, episode_number)
  INCLUDE (status);

CREATE INDEX IF NOT EXISTS idx_episode_images_episode_sort
  ON public.episode_images (episode_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_channel_tags_channel_tag
  ON public.channel_tags (channel_id, tag_id);

CREATE INDEX IF NOT EXISTS idx_creator_channels_public_feed
  ON public.creator_channels (status, updated_at DESC);

NOTIFY pgrst, 'reload schema';
