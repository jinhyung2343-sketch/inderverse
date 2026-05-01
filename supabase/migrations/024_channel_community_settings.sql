-- 024_channel_community_settings.sql
-- 웹툰/스파크 공통 채널에 댓글 운영 메타데이터 추가

ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS is_comment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS comment_policy_note TEXT;

COMMENT ON COLUMN channels.is_comment_enabled IS '채널 단위 댓글 허용 여부';
COMMENT ON COLUMN channels.comment_policy_note IS '댓글 운영 안내 문구 또는 감상 게시판 정책';
