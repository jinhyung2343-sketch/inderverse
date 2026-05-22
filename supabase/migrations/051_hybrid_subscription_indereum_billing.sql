-- 051_hybrid_subscription_indereum_billing.sql
-- 구독 기본 열람권과 인더륨 기반 개별 소장/후원 흐름을 분리한다.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_krw INTEGER NOT NULL,
  billing_period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT subscription_plans_price_check CHECK (price_krw >= 0),
  CONSTRAINT subscription_plans_billing_period_check CHECK (billing_period IN ('monthly', 'annual')),
  CONSTRAINT subscription_plans_status_check CHECK (status IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  provider TEXT,
  provider_subscription_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_subscriptions_status_check CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  CONSTRAINT user_subscriptions_period_check CHECK (current_period_end > current_period_start)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_one_active
  ON user_subscriptions(user_id)
  WHERE status IN ('trialing', 'active');

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status
  ON user_subscriptions(user_id, status, current_period_end DESC);

DROP TRIGGER IF EXISTS trg_subscription_plans_updated ON subscription_plans;
CREATE TRIGGER trg_subscription_plans_updated BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_user_subscriptions_updated ON user_subscriptions;
CREATE TRIGGER trg_user_subscriptions_updated BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES subscription_plans(id),
  amount_krw INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  provider TEXT,
  provider_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT subscription_invoices_amount_check CHECK (amount_krw >= 0),
  CONSTRAINT subscription_invoices_status_check CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'void'))
);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_user_created
  ON subscription_invoices(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS subscription_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  entitlement_type TEXT NOT NULL DEFAULT 'platform_read',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT subscription_entitlements_type_check CHECK (entitlement_type IN ('platform_read', 'supporter_badge', 'preview_access'))
);

CREATE INDEX IF NOT EXISTS idx_subscription_entitlements_user_active
  ON subscription_entitlements(user_id, entitlement_type, ends_at DESC);

CREATE TABLE IF NOT EXISTS creator_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_channel_id UUID REFERENCES creator_channels(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  paid_coin_used INTEGER NOT NULL DEFAULT 0,
  free_coin_used INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT creator_supports_amount_check CHECK (paid_coin_used >= 0 AND free_coin_used >= 0),
  CONSTRAINT creator_supports_positive_amount_check CHECK (paid_coin_used + free_coin_used > 0)
);

CREATE INDEX IF NOT EXISTS idx_creator_supports_supporter_created
  ON creator_supports(supporter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_creator_supports_creator_channel_created
  ON creator_supports(creator_channel_id, created_at DESC);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_supports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_plans_select_active" ON subscription_plans;
CREATE POLICY "subscription_plans_select_active" ON subscription_plans
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "user_subscriptions_select_self" ON user_subscriptions;
CREATE POLICY "user_subscriptions_select_self" ON user_subscriptions
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "subscription_invoices_select_self" ON subscription_invoices;
CREATE POLICY "subscription_invoices_select_self" ON subscription_invoices
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "subscription_entitlements_select_self" ON subscription_entitlements;
CREATE POLICY "subscription_entitlements_select_self" ON subscription_entitlements
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "creator_supports_select_supporter" ON creator_supports;
CREATE POLICY "creator_supports_select_supporter" ON creator_supports
  FOR SELECT USING (supporter_id = (SELECT auth.uid()));

INSERT INTO subscription_plans (id, name, price_krw, billing_period, description, features)
VALUES
  (
    'basic_monthly',
    '인더버스 구독',
    7900,
    'monthly',
    '맛보기 이후 구독 공개 회차를 이어보는 기본 이용권',
    '["구독 공개 회차 열람", "무료/맛보기 회차 전체 접근", "인더륨 개별 구매 병행"]'::jsonb
  ),
  (
    'supporter_monthly',
    '서포터 구독',
    9900,
    'monthly',
    '기본 구독에 작가 후원 흐름을 더한 고관여 독자용 플랜',
    '["구독 공개 회차 열람", "서포터 표시 예정", "월간 후원 혜택 확장 예정"]'::jsonb
  ),
  (
    'basic_annual',
    '연간 구독',
    79000,
    'annual',
    '월 구독보다 낮은 실질 단가로 길게 이용하는 플랜',
    '["기본 구독 12개월", "약 2개월 할인 기준", "장기 이용자용"]'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  price_krw = EXCLUDED.price_krw,
  billing_period = EXCLUDED.billing_period,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  status = 'active',
  updated_at = now();

CREATE OR REPLACE FUNCTION public.check_dynamic_access(
  p_user_id UUID,
  p_webtoon_id UUID,
  p_episode_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel RECORD;
  v_episode RECORD;
  v_max_free_episode INTEGER;
  v_is_subscribed BOOLEAN := FALSE;
  v_has_purchase BOOLEAN := FALSE;
BEGIN
  SELECT
    id,
    status,
    total_episodes,
    teaser_percentage,
    is_free_archive
  INTO v_channel
  FROM channels
  WHERE id = p_webtoon_id
    AND work_type IN ('webtoon', 'novel');

  IF v_channel.id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'work_not_found',
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  SELECT
    id,
    channel_id,
    episode_number,
    status
  INTO v_episode
  FROM episodes
  WHERE id = p_episode_id
    AND channel_id = p_webtoon_id;

  IF v_episode.id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'episode_not_found',
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  IF v_channel.status NOT IN ('publishing', 'completed') OR v_episode.status <> 'published' THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'not_published',
      'episodeNumber', v_episode.episode_number,
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  v_max_free_episode := GREATEST(
    1,
    floor((GREATEST(v_channel.total_episodes, 0) * v_channel.teaser_percentage)::numeric / 100)::integer
  );

  IF v_channel.is_free_archive THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', 'free_archive',
      'episodeNumber', v_episode.episode_number,
      'maxFreeEpisode', v_max_free_episode,
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  IF v_episode.episode_number <= v_max_free_episode THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', 'teaser',
      'episodeNumber', v_episode.episode_number,
      'maxFreeEpisode', v_max_free_episode,
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM purchases p
      WHERE p.user_id = p_user_id
        AND p.episode_id = p_episode_id
    )
    INTO v_has_purchase;

    IF v_has_purchase THEN
      RETURN jsonb_build_object(
        'allowed', TRUE,
        'reason', 'purchased',
        'episodeNumber', v_episode.episode_number,
        'maxFreeEpisode', v_max_free_episode,
        'triggerSubscriptionPrompt', FALSE
      );
    END IF;

    SELECT
      COALESCE(pr.is_subscribed, FALSE)
      OR EXISTS (
        SELECT 1
        FROM user_subscriptions us
        WHERE us.user_id = p_user_id
          AND us.status IN ('trialing', 'active')
          AND us.current_period_end > now()
      )
      OR EXISTS (
        SELECT 1
        FROM subscription_entitlements se
        WHERE se.user_id = p_user_id
          AND se.entitlement_type = 'platform_read'
          AND se.starts_at <= now()
          AND (se.ends_at IS NULL OR se.ends_at > now())
      )
    INTO v_is_subscribed
    FROM profiles pr
    WHERE pr.id = p_user_id;
  END IF;

  IF v_is_subscribed THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', 'subscriber',
      'episodeNumber', v_episode.episode_number,
      'maxFreeEpisode', v_max_free_episode,
      'triggerSubscriptionPrompt', FALSE
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', FALSE,
    'reason', 'subscription_required',
    'episodeNumber', v_episode.episode_number,
    'maxFreeEpisode', v_max_free_episode,
    'triggerSubscriptionPrompt', TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_dynamic_access(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_dynamic_access(UUID, UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_dynamic_access(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_dynamic_access(UUID, UUID, UUID) TO service_role;

COMMENT ON TABLE subscription_plans IS '인더버스 구독 상품 정의. 실제 PG 상품과 별도 매핑 가능';
COMMENT ON TABLE user_subscriptions IS '사용자별 구독 상태. 기본 열람권의 1차 근거';
COMMENT ON TABLE subscription_invoices IS '구독 결제/환불 장부. PG 연동 전후 모두 기록 가능';
COMMENT ON TABLE subscription_entitlements IS '구독에서 파생된 세부 권한. 플랫폼 열람권, 서포터 배지 등을 분리';
COMMENT ON TABLE creator_supports IS '인더륨으로 작가나 작품에 보내는 직접 후원 장부';
COMMENT ON FUNCTION public.check_dynamic_access(UUID, UUID, UUID)
IS '맛보기, 인더륨 개별 구매, 구독 권한 순서로 회차 접근 가능 여부를 반환한다';

NOTIFY pgrst, 'reload schema';
