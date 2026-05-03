-- 028_minor_guardian_consents.sql
-- 만 14세 미만 회원의 보호자 동의 요청 상태를 저장한다.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age_band TEXT NOT NULL DEFAULT '14_or_over'
    CHECK (age_band IN ('14_or_over', 'under_14')),
  ADD COLUMN IF NOT EXISTS guardian_consent_status TEXT NOT NULL DEFAULT 'not_required'
    CHECK (guardian_consent_status IN ('not_required', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS guardian_consent_requested_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.age_band IS '회원가입 당시 선택한 연령 구분';
COMMENT ON COLUMN profiles.guardian_consent_status IS '만 14세 미만 회원의 보호자 동의 진행 상태';
COMMENT ON COLUMN profiles.guardian_consent_requested_at IS '보호자 동의 요청이 최초 접수된 시각';

CREATE TABLE IF NOT EXISTS minor_guardian_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_email TEXT NOT NULL,
  guardian_relationship TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE minor_guardian_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "minor_guardian_consents_select"
ON minor_guardian_consents FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "minor_guardian_consents_insert"
ON minor_guardian_consents FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "minor_guardian_consents_update"
ON minor_guardian_consents FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_minor_guardian_consents_status
ON minor_guardian_consents(status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_minor_guardian_consents_user_id
ON minor_guardian_consents(user_id);

DROP TRIGGER IF EXISTS trg_minor_guardian_consents_updated ON minor_guardian_consents;
CREATE TRIGGER trg_minor_guardian_consents_updated BEFORE UPDATE ON minor_guardian_consents
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    role,
    age_band,
    guardian_consent_status,
    guardian_consent_requested_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '유저'),
    'reader',
    COALESCE(NEW.raw_user_meta_data->>'user_age_band', '14_or_over'),
    COALESCE(NEW.raw_user_meta_data->>'user_guardian_consent_status', 'not_required'),
    CASE
      WHEN NEW.raw_user_meta_data->>'user_guardian_consent_requested_at' IS NULL THEN NULL
      ELSE (NEW.raw_user_meta_data->>'user_guardian_consent_requested_at')::timestamptz
    END
  );

  INSERT INTO public.coin_wallets (id, user_id)
  VALUES (gen_random_uuid(), NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE minor_guardian_consents IS '만 14세 미만 회원의 보호자 동의 요청 이력';
COMMENT ON COLUMN minor_guardian_consents.status IS 'pending=대기, verified=확인완료, rejected=반려';
