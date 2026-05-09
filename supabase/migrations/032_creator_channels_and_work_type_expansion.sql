-- 032_creator_channels_and_work_type_expansion.sql
-- 작가 주도형 종합 창작 플랫폼으로 확장하기 위한 비파괴적 기반 구조.

ALTER TYPE work_type ADD VALUE IF NOT EXISTS 'novel';
ALTER TYPE work_type ADD VALUE IF NOT EXISTS 'audio_drama';
ALTER TYPE work_type ADD VALUE IF NOT EXISTS 'music';
ALTER TYPE work_type ADD VALUE IF NOT EXISTS 'illustration';
ALTER TYPE work_type ADD VALUE IF NOT EXISTS 'essay';
ALTER TYPE work_type ADD VALUE IF NOT EXISTS 'other';

CREATE TABLE IF NOT EXISTS creator_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_creator_channels_owner UNIQUE (owner_id),
  CONSTRAINT chk_creator_channels_status CHECK (status IN ('draft', 'active', 'suspended')),
  CONSTRAINT chk_creator_channels_slug CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,62}$')
);

ALTER TABLE creator_channels ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE creator_channels IS '작가 공개 홈/채널. 하나의 작가 채널 아래 여러 형식의 작품을 게시한다';
COMMENT ON COLUMN creator_channels.owner_id IS '작가 채널 소유자. profiles와 연결';
COMMENT ON COLUMN creator_channels.slug IS '공개 URL에 사용할 작가 채널 식별자';

CREATE INDEX IF NOT EXISTS idx_creator_channels_owner_id ON creator_channels(owner_id);
CREATE INDEX IF NOT EXISTS idx_creator_channels_status ON creator_channels(status);

CREATE POLICY "creator_channels_select_public" ON creator_channels
  FOR SELECT
  USING (
    status = 'active'
    OR owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "creator_channels_insert_owner" ON creator_channels
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

CREATE POLICY "creator_channels_update_owner_admin" ON creator_channels
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

CREATE POLICY "creator_channels_delete_owner_admin" ON creator_channels
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

ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS creator_channel_id UUID REFERENCES creator_channels(id) ON DELETE SET NULL;

COMMENT ON COLUMN channels.creator_channel_id IS '작품이 속한 작가 공개 채널. 기존 creator_id는 권한/소유자 호환용으로 유지';

CREATE INDEX IF NOT EXISTS idx_channels_creator_channel_id ON channels(creator_channel_id);
CREATE INDEX IF NOT EXISTS idx_channels_creator_channel_work_type ON channels(creator_channel_id, work_type);

INSERT INTO creator_channels (
  owner_id,
  slug,
  display_name,
  avatar_url,
  status
)
SELECT
  p.id,
  'creator-' || replace(left(p.id::text, 8), '-', ''),
  COALESCE(NULLIF(trim(p.display_name), ''), '작가'),
  p.avatar_url,
  'active'
FROM profiles p
WHERE
  p.role IN ('creator', 'admin')
  OR EXISTS (
    SELECT 1
    FROM channels c
    WHERE c.creator_id = p.id
  )
ON CONFLICT (owner_id) DO NOTHING;

UPDATE channels c
SET creator_channel_id = cc.id
FROM creator_channels cc
WHERE c.creator_id = cc.owner_id
  AND c.creator_channel_id IS NULL;

CREATE TABLE IF NOT EXISTS content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT,
  public_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  width INT,
  height INT,
  duration_seconds INT,
  file_size_bytes INT,
  processing_status TEXT NOT NULL DEFAULT 'ready',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_content_assets_asset_type CHECK (
    asset_type IN (
      'cover_image',
      'episode_image',
      'panel_image',
      'novel_body_image',
      'audio',
      'music',
      'illustration',
      'attachment',
      'other'
    )
  ),
  CONSTRAINT chk_content_assets_processing_status CHECK (
    processing_status IN ('pending', 'processing', 'ready', 'failed')
  ),
  CONSTRAINT chk_content_assets_sort_order CHECK (sort_order >= 0)
);

ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE content_assets IS '웹툰 이미지, 웹소설 삽화, 오디오, 음악 등 콘텐츠 자산을 공통으로 저장하는 확장 테이블';
COMMENT ON COLUMN content_assets.channel_id IS '현재 channels 테이블이 작품 루트 역할을 하므로 work_id에 해당';
COMMENT ON COLUMN content_assets.episode_id IS '연재형 작품의 개별 회차/파트 자산일 때 연결';
COMMENT ON COLUMN content_assets.asset_type IS 'cover_image, episode_image, audio, music 등 자산 역할';

CREATE INDEX IF NOT EXISTS idx_content_assets_channel_id ON content_assets(channel_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_episode_id ON content_assets(episode_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_asset_type ON content_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_content_assets_channel_sort ON content_assets(channel_id, sort_order);

CREATE POLICY "content_assets_select_public" ON content_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM channels c
      WHERE c.id = content_assets.channel_id
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
    OR EXISTS (
      SELECT 1
      FROM channels c
      WHERE c.id = content_assets.channel_id
        AND c.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "content_assets_insert_owner_admin" ON content_assets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM channels c
      WHERE c.id = content_assets.channel_id
        AND c.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "content_assets_update_owner_admin" ON content_assets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM channels c
      WHERE c.id = content_assets.channel_id
        AND c.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM channels c
      WHERE c.id = content_assets.channel_id
        AND c.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "content_assets_delete_owner_admin" ON content_assets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM channels c
      WHERE c.id = content_assets.channel_id
        AND c.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );
