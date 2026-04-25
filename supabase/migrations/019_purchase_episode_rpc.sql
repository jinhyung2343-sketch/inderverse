-- 019_purchase_episode_rpc.sql
-- 에피소드 구매를 원자적으로 처리하는 RPC

CREATE OR REPLACE FUNCTION public.purchase_episode(
  p_user_id UUID,
  p_episode_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_episode episodes%ROWTYPE;
  v_wallet coin_wallets%ROWTYPE;
  v_total_balance INT;
  v_free_used INT := 0;
  v_paid_used INT := 0;
  v_existing_purchase UUID;
  v_purchase_id UUID;
  v_is_adult_verified BOOLEAN := false;
BEGIN
  SELECT is_adult_verified
  INTO v_is_adult_verified
  FROM profiles
  WHERE id = p_user_id;

  SELECT id
  INTO v_existing_purchase
  FROM purchases
  WHERE user_id = p_user_id
    AND episode_id = p_episode_id
  LIMIT 1;

  IF v_existing_purchase IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_purchased',
      'purchase_id', v_existing_purchase
    );
  END IF;

  SELECT e.*
  INTO v_episode
  FROM episodes e
  JOIN channels c ON c.id = e.channel_id
  WHERE e.id = p_episode_id
    AND e.status = 'published'
    AND c.status IN ('publishing', 'completed')
    AND (
      e.is_adult_only = false
      OR v_is_adult_verified = true
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Episode not available for purchase';
  END IF;

  IF v_episode.coin_price <= 0 THEN
    RAISE EXCEPTION 'Episode is free';
  END IF;

  SELECT *
  INTO v_wallet
  FROM coin_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  v_total_balance := v_wallet.paid_balance + v_wallet.free_balance;

  IF v_total_balance < v_episode.coin_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  IF v_wallet.free_balance >= v_episode.coin_price THEN
    v_free_used := v_episode.coin_price;
  ELSE
    v_free_used := v_wallet.free_balance;
    v_paid_used := v_episode.coin_price - v_free_used;
  END IF;

  UPDATE coin_wallets
  SET
    free_balance = free_balance - v_free_used,
    paid_balance = paid_balance - v_paid_used
  WHERE id = v_wallet.id;

  INSERT INTO purchases (
    user_id,
    episode_id,
    coin_amount,
    paid_coin_used,
    free_coin_used
  )
  VALUES (
    p_user_id,
    p_episode_id,
    v_episode.coin_price,
    v_paid_used,
    v_free_used
  )
  RETURNING id INTO v_purchase_id;

  INSERT INTO coin_transactions (
    user_id,
    type,
    coin_type,
    amount,
    balance_after,
    reference_id,
    description
  )
  VALUES (
    p_user_id,
    'use',
    CASE WHEN v_free_used > 0 THEN 'free'::coin_type ELSE 'paid'::coin_type END,
    -v_episode.coin_price,
    v_total_balance - v_episode.coin_price,
    v_purchase_id,
    '에피소드 열람'
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'purchase_id', v_purchase_id,
    'paid_used', v_paid_used,
    'free_used', v_free_used,
    'balance_after', v_total_balance - v_episode.coin_price
  );
EXCEPTION
  WHEN unique_violation THEN
    SELECT id
    INTO v_existing_purchase
    FROM purchases
    WHERE user_id = p_user_id
      AND episode_id = p_episode_id
    LIMIT 1;

    RETURN jsonb_build_object(
      'status', 'already_purchased',
      'purchase_id', v_existing_purchase
    );
END;
$$;
