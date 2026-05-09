-- 034_creator_channel_external_links.sql
-- 작가 공개 채널에 외부 링크를 담기 위한 비파괴적 확장.

ALTER TABLE creator_channels
  ADD COLUMN IF NOT EXISTS external_links JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN creator_channels.external_links IS '작가 채널에 노출할 외부 링크 목록. [{label,url}] 형태로 저장한다';
