-- 014_settlements.sql
-- 월별(또는 주기별) 정산 테이블

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_purchases INT NOT NULL DEFAULT 0,
  gross_revenue_coins BIGINT NOT NULL DEFAULT 0,
  paid_coin_revenue BIGINT NOT NULL DEFAULT 0,
  free_coin_revenue BIGINT NOT NULL DEFAULT 0,
  creator_amount BIGINT NOT NULL DEFAULT 0,
  platform_amount BIGINT NOT NULL DEFAULT 0,
  creator_share_pct_snapshot NUMERIC(5,2) NOT NULL,
  status settlement_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE settlements IS '정산 데이터 테이블. (무료 코인 매출은 정산 작가 몫에서 제외 등 복잡한 계산 결과 담기)';
COMMENT ON COLUMN settlements.creator_id IS '비정규화: 빠른 조회를 위해 추가';
