-- 030_channel_age_rating.sql
-- 작품 단위(channel)에 연령 등급과 자가 체크리스트를 저장한다.

ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS age_rating TEXT NOT NULL DEFAULT 'all'
    CHECK (age_rating IN ('all', '12', '15', '19')),
  ADD COLUMN IF NOT EXISTS rating_checklist JSONB NOT NULL DEFAULT '{
    "sexualContent": "none",
    "violence": "none",
    "language": "none"
  }'::jsonb;

COMMENT ON COLUMN channels.age_rating IS '작품 전체 연령 등급. all/12/15/19 중 하나';
COMMENT ON COLUMN channels.rating_checklist IS '작가 자가 체크리스트. 선정성/폭력성/언어 수위를 JSON으로 저장';

CREATE INDEX IF NOT EXISTS idx_channels_age_rating ON channels(age_rating);
