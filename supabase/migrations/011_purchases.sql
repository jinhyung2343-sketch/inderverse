-- 011_purchases.sql
-- 에피소드 구매(결제) 이력 테이블

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  coin_amount INT NOT NULL,
  paid_coin_used INT NOT NULL DEFAULT 0,
  free_coin_used INT NOT NULL DEFAULT 0,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_purchase UNIQUE (user_id, episode_id),
  CONSTRAINT chk_purchase_coin_sum CHECK (paid_coin_used + free_coin_used = coin_amount)
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE purchases IS '에피소드 구매 이력. 정산의 기준 데이터';
COMMENT ON COLUMN purchases.paid_coin_used IS '정산 대상 금액 계산용';
