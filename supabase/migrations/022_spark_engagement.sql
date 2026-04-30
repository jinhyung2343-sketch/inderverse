-- 022_spark_engagement.sql
-- 스파크 전용 소비 신호(조회/반응/저장) 집계 테이블

CREATE TABLE spark_views (
  id BIGSERIAL PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,
  anon_id TEXT
);

CREATE TABLE spark_reactions (
  id BIGSERIAL PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reacted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reaction_type TEXT NOT NULL DEFAULT 'applause',
  anon_id TEXT,

  CONSTRAINT chk_spark_reaction_type CHECK (reaction_type IN ('applause'))
);

CREATE TABLE spark_saves (
  id BIGSERIAL PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_spark_save UNIQUE (channel_id, user_id)
);

ALTER TABLE spark_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_saves ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE spark_views IS '스파크 상세 진입 기준 조회 로그';
COMMENT ON TABLE spark_reactions IS '스파크 반응 로그. 현재는 applause만 사용';
COMMENT ON TABLE spark_saves IS '로그인 사용자의 스파크 저장 상태';

CREATE POLICY "spark_views_insert_public" ON spark_views
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM channels c
      WHERE c.id = channel_id
        AND c.work_type = 'spark'
        AND c.status IN ('publishing', 'completed')
        AND (
          c.is_adult_only = false
          OR EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.is_adult_verified = true
          )
        )
    )
  );

CREATE POLICY "spark_views_select_owner_admin" ON spark_views
  FOR SELECT
  USING (
    channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "spark_reactions_insert_public" ON spark_reactions
  FOR INSERT
  WITH CHECK (
    reaction_type = 'applause'
    AND EXISTS (
      SELECT 1
      FROM channels c
      WHERE c.id = channel_id
        AND c.work_type = 'spark'
        AND c.status IN ('publishing', 'completed')
        AND (
          c.is_adult_only = false
          OR EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.is_adult_verified = true
          )
        )
    )
  );

CREATE POLICY "spark_reactions_select_owner_admin" ON spark_reactions
  FOR SELECT
  USING (
    channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "spark_saves_select_self" ON spark_saves
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "spark_saves_insert_self" ON spark_saves
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM channels c
      WHERE c.id = channel_id
        AND c.work_type = 'spark'
        AND c.status IN ('publishing', 'completed')
    )
  );

CREATE POLICY "spark_saves_delete_self" ON spark_saves
  FOR DELETE
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_spark_views_channel_id ON spark_views(channel_id);
CREATE INDEX IF NOT EXISTS idx_spark_views_viewed_at ON spark_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_spark_reactions_channel_id ON spark_reactions(channel_id);
CREATE INDEX IF NOT EXISTS idx_spark_reactions_reacted_at ON spark_reactions(reacted_at);
CREATE INDEX IF NOT EXISTS idx_spark_saves_channel_id ON spark_saves(channel_id);
CREATE INDEX IF NOT EXISTS idx_spark_saves_user_id ON spark_saves(user_id);
