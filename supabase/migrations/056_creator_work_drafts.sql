-- Account-scoped editor drafts for cross-device creative continuity.

CREATE TABLE IF NOT EXISTS creator_work_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  draft_type TEXT NOT NULL,
  draft_key TEXT NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT creator_work_drafts_owner_type_key_unique UNIQUE (owner_id, draft_type, draft_key),
  CONSTRAINT chk_creator_work_drafts_type CHECK (
    draft_type IN ('webtoon_channel', 'webtoon_episode')
  ),
  CONSTRAINT chk_creator_work_drafts_key_length CHECK (
    char_length(draft_key) BETWEEN 1 AND 160
  )
);

ALTER TABLE creator_work_drafts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE creator_work_drafts IS '계정 기준 작품 편집 초안. 디바이스/브라우저가 바뀌어도 작성 중인 메타데이터와 업로드 완료 자산 URL을 이어가기 위해 사용한다.';
COMMENT ON COLUMN creator_work_drafts.draft_key IS 'new 또는 channel/episode id를 포함한 클라이언트 안정 키';
COMMENT ON COLUMN creator_work_drafts.payload IS '폼 입력값, 저장 시각, 업로드 완료 이미지 URL과 정렬 정보';

CREATE INDEX IF NOT EXISTS idx_creator_work_drafts_owner_updated
  ON creator_work_drafts(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_work_drafts_channel
  ON creator_work_drafts(channel_id)
  WHERE channel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_creator_work_drafts_episode
  ON creator_work_drafts(episode_id)
  WHERE episode_id IS NOT NULL;

CREATE POLICY "creator_work_drafts_select_owner_admin" ON creator_work_drafts
  FOR SELECT
  USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "creator_work_drafts_insert_owner_creator" ON creator_work_drafts
  FOR INSERT
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('creator', 'admin')
    )
  );

CREATE POLICY "creator_work_drafts_update_owner_admin" ON creator_work_drafts
  FOR UPDATE
  USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "creator_work_drafts_delete_owner_admin" ON creator_work_drafts
  FOR DELETE
  USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );
