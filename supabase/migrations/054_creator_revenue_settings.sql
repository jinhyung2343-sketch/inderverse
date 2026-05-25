-- 054_creator_revenue_settings.sql
-- 정산 설정을 작품/채널 단위가 아니라 작가 계정 단위로 관리한다.

CREATE TABLE IF NOT EXISTS creator_revenue_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  creator_share_pct NUMERIC(5,2) NOT NULL DEFAULT 70.00,
  platform_share_pct NUMERIC(5,2) GENERATED ALWAYS AS (100.00 - creator_share_pct) STORED,
  min_payout_amount INT NOT NULL DEFAULT 10000,
  payout_method payout_method,
  bank_info_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_creator_revenue_share CHECK (creator_share_pct = 70.00),
  CONSTRAINT chk_creator_revenue_min_payout CHECK (min_payout_amount >= 1000)
);

ALTER TABLE creator_revenue_settings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_creator_revenue_settings_creator_id
  ON creator_revenue_settings(creator_id);

INSERT INTO creator_revenue_settings (
  creator_id,
  creator_share_pct,
  min_payout_amount,
  payout_method,
  bank_info_encrypted,
  updated_at
)
SELECT DISTINCT ON (c.creator_id)
  c.creator_id,
  rs.creator_share_pct,
  rs.min_payout_amount,
  rs.payout_method,
  rs.bank_info_encrypted,
  rs.updated_at
FROM revenue_settings rs
JOIN channels c ON c.id = rs.channel_id
ORDER BY c.creator_id, rs.updated_at DESC
ON CONFLICT (creator_id) DO NOTHING;

DROP POLICY IF EXISTS "creator_revenue_settings_select_owner_admin" ON creator_revenue_settings;
CREATE POLICY "creator_revenue_settings_select_owner_admin" ON creator_revenue_settings
  FOR SELECT
  USING (
    creator_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "creator_revenue_settings_insert_owner_admin" ON creator_revenue_settings;
CREATE POLICY "creator_revenue_settings_insert_owner_admin" ON creator_revenue_settings
  FOR INSERT
  WITH CHECK (
    creator_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "creator_revenue_settings_update_owner_admin" ON creator_revenue_settings;
CREATE POLICY "creator_revenue_settings_update_owner_admin" ON creator_revenue_settings
  FOR UPDATE
  USING (
    creator_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    creator_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS trg_creator_revenue_settings_updated ON creator_revenue_settings;
CREATE TRIGGER trg_creator_revenue_settings_updated BEFORE UPDATE ON creator_revenue_settings
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE creator_revenue_settings IS '작가 계정 단위 정산 설정. 작품 등록 폼에서 반복 입력하지 않고 작가 등록/정산 관리 흐름에서 유지한다';
COMMENT ON COLUMN creator_revenue_settings.creator_id IS '정산 설정을 소유한 작가 프로필';
COMMENT ON COLUMN creator_revenue_settings.creator_share_pct IS '플랫폼 일반 정산 기준 작가 몫 70% 고정';
COMMENT ON COLUMN creator_revenue_settings.bank_info_encrypted IS '암호화된 정산 계좌 정보';
COMMENT ON TABLE revenue_settings IS '레거시 채널 단위 정산 설정. 신규 작품 등록 흐름에서는 사용하지 않고 작가 단위 creator_revenue_settings를 기준으로 한다';
