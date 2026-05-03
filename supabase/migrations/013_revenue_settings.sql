-- 013_revenue_settings.sql
-- 작가별 채널 수익 설정 테이블 (보안 처리됨)

CREATE TABLE revenue_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL UNIQUE REFERENCES channels(id) ON DELETE CASCADE,
  creator_share_pct NUMERIC(5,2) NOT NULL DEFAULT 70.00,
  platform_share_pct NUMERIC(5,2) GENERATED ALWAYS AS (100.00 - creator_share_pct) STORED,
  min_payout_amount INT NOT NULL DEFAULT 10000,
  payout_method payout_method,
  bank_info_encrypted TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_creator_share CHECK (creator_share_pct = 70.00)
);

ALTER TABLE revenue_settings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE revenue_settings IS '안전한 작가 수익 설정 및 계좌정보. bank_info_encrypted는 app단이나 Vault를 통하여 암/복호화';
COMMENT ON COLUMN revenue_settings.creator_share_pct IS '플랫폼 일반 정산 기준 작가 몫 70% 고정';
