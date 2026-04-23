-- 009_coin_wallets.sql
-- 유저 코인 잔액 테이블

CREATE TABLE coin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  paid_balance INT NOT NULL DEFAULT 0,
  free_balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_paid_balance CHECK (paid_balance >= 0),
  CONSTRAINT chk_free_balance CHECK (free_balance >= 0)
);

ALTER TABLE coin_wallets ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE coin_wallets IS '유저별 코인 지갑 잔액. 정산을 위해 유료/무료(이벤트) 분리 관리';
