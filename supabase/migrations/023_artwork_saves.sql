-- 023_artwork_saves.sql
-- 목업 explore 작품을 서버 기반 라이브러리로 저장하기 위한 테이블

CREATE TABLE artwork_saves (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artwork_id TEXT NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_artwork_save UNIQUE (user_id, artwork_id)
);

ALTER TABLE artwork_saves ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE artwork_saves IS 'explore 작품 저장 상태. 현재는 mock artwork_id를 기준으로 저장';
COMMENT ON COLUMN artwork_saves.artwork_id IS 'src/lib/mock/explore-data.ts의 artwork.id';

CREATE POLICY "artwork_saves_select_self" ON artwork_saves
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

CREATE POLICY "artwork_saves_insert_self" ON artwork_saves
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "artwork_saves_delete_self" ON artwork_saves
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

CREATE INDEX IF NOT EXISTS idx_artwork_saves_user_id ON artwork_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_artwork_saves_artwork_id ON artwork_saves(artwork_id);
