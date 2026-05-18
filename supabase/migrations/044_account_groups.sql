-- 044_account_groups.sql
-- 복수 계정 허용 정책을 위한 서버 기준 계정 그룹 골격

CREATE TABLE account_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL DEFAULT '계정 그룹',
  status TEXT NOT NULL DEFAULT 'active',
  created_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT account_groups_status_check CHECK (status IN ('active', 'suspended', 'closed'))
);

CREATE TABLE account_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_group_id UUID NOT NULL REFERENCES account_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL DEFAULT 'owner',
  status TEXT NOT NULL DEFAULT 'active',
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT account_group_members_role_check CHECK (
    member_role IN ('owner', 'member', 'manager', 'finance', 'support')
  ),
  CONSTRAINT account_group_members_status_check CHECK (
    status IN ('active', 'invited', 'removed')
  ),
  CONSTRAINT account_group_members_group_user_key UNIQUE (account_group_id, user_id)
);

CREATE UNIQUE INDEX account_group_members_one_active_group_per_user_idx
  ON account_group_members(user_id)
  WHERE status = 'active';

CREATE INDEX account_group_members_group_idx
  ON account_group_members(account_group_id, status);

CREATE TABLE account_switch_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_group_id UUID REFERENCES account_groups(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT 'manual_switch',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX account_switch_audit_logs_group_created_idx
  ON account_switch_audit_logs(account_group_id, created_at DESC);

CREATE INDEX account_switch_audit_logs_actor_created_idx
  ON account_switch_audit_logs(actor_user_id, created_at DESC);

CREATE TABLE account_group_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_group_id UUID NOT NULL REFERENCES account_groups(id) ON DELETE CASCADE,
  subject_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verification_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT account_group_verifications_type_check CHECK (
    verification_type IN ('identity', 'business', 'settlement', 'adult', 'guardian')
  ),
  CONSTRAINT account_group_verifications_status_check CHECK (
    status IN ('pending', 'verified', 'rejected', 'expired')
  )
);

CREATE UNIQUE INDEX account_group_verifications_scope_key
  ON account_group_verifications(
    account_group_id,
    verification_type,
    COALESCE(subject_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE INDEX account_group_verifications_group_idx
  ON account_group_verifications(account_group_id, verification_type, status);

CREATE TRIGGER trg_account_groups_updated BEFORE UPDATE ON account_groups
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_account_group_members_updated BEFORE UPDATE ON account_group_members
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_account_group_verifications_updated BEFORE UPDATE ON account_group_verifications
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

ALTER TABLE account_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_switch_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_group_verifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION fn_is_admin_profile()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_is_active_account_group_member(p_account_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM account_group_members agm
    WHERE agm.account_group_id = p_account_group_id
      AND agm.user_id = (SELECT auth.uid())
      AND agm.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_is_account_group_owner(p_account_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM account_group_members agm
    WHERE agm.account_group_id = p_account_group_id
      AND agm.user_id = (SELECT auth.uid())
      AND agm.member_role = 'owner'
      AND agm.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE POLICY "account_groups_select_self_admin" ON account_groups
  FOR SELECT
  USING (
    fn_is_active_account_group_member(id)
    OR fn_is_admin_profile()
  );

CREATE POLICY "account_groups_update_admin" ON account_groups
  FOR UPDATE
  USING (
    fn_is_admin_profile()
  )
  WITH CHECK (
    fn_is_admin_profile()
  );

CREATE POLICY "account_group_members_select_self_admin" ON account_group_members
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR fn_is_admin_profile()
  );

CREATE POLICY "account_group_members_update_admin" ON account_group_members
  FOR UPDATE
  USING (
    fn_is_admin_profile()
  )
  WITH CHECK (
    fn_is_admin_profile()
  );

CREATE POLICY "account_switch_audit_logs_select_admin" ON account_switch_audit_logs
  FOR SELECT
  USING (
    fn_is_admin_profile()
  );

CREATE POLICY "account_group_verifications_select_admin" ON account_group_verifications
  FOR SELECT
  USING (
    fn_is_admin_profile()
  );

WITH users_without_group AS (
  SELECT
    p.id AS user_id,
    p.display_name,
    gen_random_uuid() AS group_id
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1
    FROM account_group_members agm
    WHERE agm.user_id = p.id
      AND agm.status = 'active'
  )
),
created_groups AS (
  INSERT INTO account_groups (id, display_name, created_by_profile_id)
  SELECT
    group_id,
    COALESCE(NULLIF(display_name, ''), '유저') || ' 계정 그룹',
    user_id
  FROM users_without_group
  RETURNING id
)
INSERT INTO account_group_members (account_group_id, user_id, member_role)
SELECT
  users_without_group.group_id,
  users_without_group.user_id,
  'owner'
FROM users_without_group
JOIN created_groups ON created_groups.id = users_without_group.group_id;

CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id UUID;
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

  INSERT INTO public.account_groups (display_name, created_by_profile_id)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'display_name', '유저') || ' 계정 그룹', NEW.id)
  RETURNING id INTO v_group_id;

  INSERT INTO public.account_group_members (account_group_id, user_id, member_role)
  VALUES (v_group_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE account_groups IS '복수 계정 정책의 서버 기준 소유/책임 그룹. 공개 프로필 데이터가 아니며 운영/정산/신뢰안전 판단용';
COMMENT ON TABLE account_group_members IS '계정 그룹에 속한 auth 사용자 계정 목록. 연결 계정 전체 목록은 관리자/운영 주체만 직접 열람';
COMMENT ON TABLE account_switch_audit_logs IS '계정 전환 및 민감한 계정 전환성 작업 감사 로그. 관리자/운영 주체 전용';
COMMENT ON TABLE account_group_verifications IS '계정 그룹 단위 또는 그룹 내 계정 단위 인증 상태. 관리자/운영 주체 전용';
COMMENT ON INDEX account_group_members_one_active_group_per_user_idx IS '현재 모델에서는 한 로그인 계정이 하나의 활성 책임 그룹에만 속한다';
