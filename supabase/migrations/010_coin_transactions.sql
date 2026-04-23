-- 010_coin_transactions.sql
-- 코인 변동 원장 테이블 (불변)

CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type coin_tx_type NOT NULL,
  coin_type coin_type NOT NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  reference_id UUID,
  payment_provider TEXT,
  idempotency_key TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE coin_transactions IS '코인 변동 원장(불변). 충전, 사용, 만료 등 모든 내역 기록';
COMMENT ON COLUMN coin_transactions.amount IS '양수는 증가(충전/보너스), 음수는 감소(사용/만료)';
COMMENT ON COLUMN coin_transactions.idempotency_key IS '결제/충전 재시도 시 중복 처리 방지 키';
