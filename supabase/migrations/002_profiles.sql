-- 002_profiles.sql
-- 유저/작가 통합 프로필 테이블

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '유저',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'reader',
  is_adult_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS는 015에서 일괄 적용
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE profiles IS '유저/작가 통합 프로필. auth.users와 1:1';
COMMENT ON COLUMN profiles.role IS 'reader=독자, creator=작가, admin=관리자';
COMMENT ON COLUMN profiles.is_adult_verified IS '성인인증 완료 여부 (age_verifications 기반)';
