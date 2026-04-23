-- 003_age_verifications.sql
-- 성인인증 이력 테이블

CREATE TABLE age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider age_verify_provider NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ci_hash TEXT,
  
  CONSTRAINT unique_active_verification UNIQUE (user_id, provider)
);

ALTER TABLE age_verifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_age_verifications_user ON age_verifications(user_id);
CREATE INDEX idx_age_verifications_expires ON age_verifications(expires_at);

COMMENT ON TABLE age_verifications IS '성인인증 이력. 1년 주기 갱신';
COMMENT ON COLUMN age_verifications.ci_hash IS 'CI(연계정보) 해시값 — 중복 가입 방지';
