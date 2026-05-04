-- 029_minor_guardian_contact_channel.sql
-- 보호자 동의 요청에 연락처를 추가하고 추후 휴대폰 인증 연동 여지를 남긴다.

ALTER TABLE minor_guardian_consents
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS verification_channel TEXT NOT NULL DEFAULT 'phone'
    CHECK (verification_channel IN ('phone', 'email')),
  ADD COLUMN IF NOT EXISTS verification_note TEXT;

COMMENT ON COLUMN minor_guardian_consents.guardian_phone IS '보호자 연락처. 추후 PASS/통신사 인증 연동에 사용 가능';
COMMENT ON COLUMN minor_guardian_consents.verification_channel IS '현재 보호자 확인을 진행할 기본 연락 채널';
COMMENT ON COLUMN minor_guardian_consents.verification_note IS '보호자 확인 진행 메모 또는 연동 상태 설명';
