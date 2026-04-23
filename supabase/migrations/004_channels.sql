-- 004_channels.sql
-- 작품(웹툰) 채널 테이블

CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_adult_only BOOLEAN NOT NULL DEFAULT FALSE,
  status channel_status NOT NULL DEFAULT 'draft',
  serialization_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  wait_free_hours INT NOT NULL DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_wait_free_hours CHECK (wait_free_hours >= 0 AND wait_free_hours <= 168)
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE channels IS '작품(웹툰) 채널. 작가당 다수 보유 가능';
COMMENT ON COLUMN channels.serialization_days IS '연재 요일 배열 (0=일~6=토). 예: [1,3,5]';
COMMENT ON COLUMN channels.wait_free_hours IS '기다리면 무료 대기 시간(시간). 기본 24h';
