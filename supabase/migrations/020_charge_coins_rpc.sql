-- 020_charge_coins_rpc.sql
-- 개발용 코인 충전을 원자적으로 처리하는 RPC

CREATE OR REPLACE FUNCTION public.charge_coins(
  p_user_id UUID,
  p_amount INT,
  p_payment_provider TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet coin_wallets%ROWTYPE;
  v_existing_tx UUID;
  v_new_balance INT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 THEN
    RAISE EXCEPTION 'Invalid idempotency key';
  END IF;

  SELECT id
  INTO v_existing_tx
  FROM coin_transactions
  WHERE idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_existing_tx IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_processed',
      'transaction_id', v_existing_tx
    );
  END IF;

  SELECT *
  INTO v_wallet
  FROM coin_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  v_new_balance := v_wallet.paid_balance + p_amount;

  UPDATE coin_wallets
  SET paid_balance = v_new_balance
  WHERE id = v_wallet.id;

  INSERT INTO coin_transactions (
    user_id,
    type,
    coin_type,
    amount,
    balance_after,
    payment_provider,
    idempotency_key,
    description
  )
  VALUES (
    p_user_id,
    'charge',
    'paid',
    p_amount,
    v_new_balance + v_wallet.free_balance,
    p_payment_provider,
    p_idempotency_key,
    '개발용 유료 코인 충전'
  )
  RETURNING id INTO v_existing_tx;

  RETURN jsonb_build_object(
    'status', 'success',
    'transaction_id', v_existing_tx,
    'paid_balance', v_new_balance,
    'free_balance', v_wallet.free_balance,
    'balance_after', v_new_balance + v_wallet.free_balance
  );
EXCEPTION
  WHEN unique_violation THEN
    SELECT id
    INTO v_existing_tx
    FROM coin_transactions
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    RETURN jsonb_build_object(
      'status', 'already_processed',
      'transaction_id', v_existing_tx
    );
END;
$$;
