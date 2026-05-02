-- 025_creator_agreement_consents.sql
-- 작가 등록 단계에서 버전별 동의 이력을 저장

CREATE TABLE IF NOT EXISTS creator_agreement_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreement_version TEXT NOT NULL,
  is_agreed BOOLEAN NOT NULL DEFAULT TRUE,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT creator_agreement_consents_user_version_key UNIQUE (user_id, agreement_version)
);

ALTER TABLE creator_agreement_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_agreement_consents_select"
ON creator_agreement_consents FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "creator_agreement_consents_insert"
ON creator_agreement_consents FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "creator_agreement_consents_update"
ON creator_agreement_consents FOR UPDATE
USING (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_creator_agreement_consents_user_id
ON creator_agreement_consents(user_id);

CREATE INDEX IF NOT EXISTS idx_creator_agreement_consents_version
ON creator_agreement_consents(agreement_version);

COMMENT ON TABLE creator_agreement_consents IS '작가 등록 단계에서 동의한 약관 버전 이력';
COMMENT ON COLUMN creator_agreement_consents.agreement_version IS '예: creator_agreement_v1.0';
COMMENT ON COLUMN creator_agreement_consents.is_agreed IS '현재 버전에 대해 사용자가 명시적으로 동의했는지 여부';
COMMENT ON COLUMN creator_agreement_consents.agreed_at IS '사용자가 해당 버전에 동의한 시각';
