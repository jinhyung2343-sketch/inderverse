-- 008_episode_views.sql
-- 조회수 로그 테이블

CREATE TABLE episode_views (
  id BIGSERIAL PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT
);

ALTER TABLE episode_views ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE episode_views IS '에피소드 조회수 로그 테이블. 집계는 배치 처리 권장';
COMMENT ON COLUMN episode_views.ip_hash IS '비회원 중복 조회수 방지용 IP 해시';
