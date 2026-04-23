-- 012_wait_free_unlocks.sql
-- 기다리면 무료 해금 테이블

CREATE TABLE wait_free_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_unlock_available_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT unique_wait_free_unlock UNIQUE (user_id, episode_id)
);

ALTER TABLE wait_free_unlocks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE wait_free_unlocks IS '기다무 해금 내역. 채널별 마지막 해금 시간 기반 도출됨';
