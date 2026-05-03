-- 027_user_terms_consents.sql
-- 일반 회원가입 단계의 약관 동의 이력을 버전 기준으로 저장

CREATE TABLE IF NOT EXISTS user_terms_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  payment_policy_version TEXT NOT NULL,
  community_policy_version TEXT NOT NULL,
  required_terms_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  age_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  payment_policy_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  community_policy_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  recommendation_data_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  email_notification_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  push_notification_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_terms_consents_user_policy_versions_key UNIQUE (
    user_id,
    terms_version,
    privacy_version,
    payment_policy_version,
    community_policy_version
  )
);

ALTER TABLE user_terms_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_terms_consents_select"
ON user_terms_consents FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "user_terms_consents_insert"
ON user_terms_consents FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_terms_consents_update"
ON user_terms_consents FOR UPDATE
USING (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_user_terms_consents_user_id
ON user_terms_consents(user_id);

CREATE INDEX IF NOT EXISTS idx_user_terms_consents_agreed_at
ON user_terms_consents(agreed_at DESC);

COMMENT ON TABLE user_terms_consents IS '일반 회원가입 단계에서 저장하는 약관/정책 동의 이력';
COMMENT ON COLUMN user_terms_consents.terms_version IS '예: user_terms_v1.0';
COMMENT ON COLUMN user_terms_consents.privacy_version IS '예: privacy_policy_v1.0';
COMMENT ON COLUMN user_terms_consents.payment_policy_version IS '예: payment_policy_v1.0';
COMMENT ON COLUMN user_terms_consents.community_policy_version IS '예: community_policy_v1.0';
COMMENT ON COLUMN user_terms_consents.agreed_at IS '회원이 해당 버전 조합에 동의한 시각';
