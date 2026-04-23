-- 006_episodes.sql
-- 에피소드 테이블

CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  episode_number INT NOT NULL,
  title TEXT NOT NULL,
  pricing_type episode_pricing NOT NULL DEFAULT 'free',
  coin_price INT NOT NULL DEFAULT 0,
  is_adult_only BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  status episode_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_coin_price CHECK (coin_price >= 0),
  CONSTRAINT unique_channel_episode UNIQUE (channel_id, episode_number)
);

ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE episodes IS '에피소드. 조회수는 episode_views 테이블에서 별도 집계';
COMMENT ON COLUMN episodes.pricing_type IS 'free=무료, paid=유료, wait_free=기다리면무료';
