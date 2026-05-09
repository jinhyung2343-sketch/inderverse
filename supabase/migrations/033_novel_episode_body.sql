-- 033_novel_episode_body.sql
-- 웹소설/에세이처럼 텍스트 본문 중심 회차를 저장하기 위한 비파괴 확장.

ALTER TABLE episodes
  ADD COLUMN IF NOT EXISTS body_text TEXT,
  ADD COLUMN IF NOT EXISTS body_json JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN episodes.body_text IS '웹소설/에세이 등 텍스트형 회차의 원문 본문';
COMMENT ON COLUMN episodes.body_json IS '문단, 주석, 서식 등 텍스트형 회차의 확장 본문 메타데이터';
