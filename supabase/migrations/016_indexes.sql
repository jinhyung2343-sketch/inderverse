-- 016_indexes.sql
-- 검색 및 RLS 성능 향상을 위한 인덱스 일괄 적용

CREATE INDEX IF NOT EXISTS idx_channels_creator_id ON channels(creator_id);
CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status);

CREATE INDEX IF NOT EXISTS idx_channel_tags_tag_id ON channel_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_episodes_channel_id ON episodes(channel_id);
-- unique index for (channel_id, episode_number) is handled in created table constraint

CREATE INDEX IF NOT EXISTS idx_episode_views_episode_id ON episode_views(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_views_viewed_at ON episode_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_tx_created_at ON coin_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_coin_tx_reference ON coin_transactions(reference_id);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_episode_id ON purchases(episode_id);

CREATE INDEX IF NOT EXISTS idx_wait_free_channel ON wait_free_unlocks(user_id, channel_id);

CREATE INDEX IF NOT EXISTS idx_settlements_creator ON settlements(creator_id);
CREATE INDEX IF NOT EXISTS idx_settlements_channel ON settlements(channel_id);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period_start, period_end);
