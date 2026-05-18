-- 046_link_account_group_member.sql
-- 소유 확인이 끝난 계정을 현재 책임 그룹에 공식 연결한다.

CREATE OR REPLACE FUNCTION public.link_account_group_member(
  p_owner_user_id UUID,
  p_target_user_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_group_id UUID;
  v_target_previous_group_id UUID;
  v_target_profile_id UUID;
  v_result JSONB;
BEGIN
  IF p_owner_user_id IS NULL OR p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Account ids are required';
  END IF;

  IF p_owner_user_id = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot link the same account';
  END IF;

  SELECT agm.account_group_id
  INTO v_owner_group_id
  FROM account_group_members agm
  WHERE agm.user_id = p_owner_user_id
    AND agm.status = 'active'
    AND agm.member_role = 'owner'
  ORDER BY agm.linked_at ASC
  LIMIT 1;

  IF v_owner_group_id IS NULL THEN
    RAISE EXCEPTION 'Owner account group not found';
  END IF;

  SELECT p.id
  INTO v_target_profile_id
  FROM profiles p
  WHERE p.id = p_target_user_id;

  IF v_target_profile_id IS NULL THEN
    RAISE EXCEPTION 'Target profile not found';
  END IF;

  SELECT agm.account_group_id
  INTO v_target_previous_group_id
  FROM account_group_members agm
  WHERE agm.user_id = p_target_user_id
    AND agm.status = 'active'
  ORDER BY agm.linked_at ASC
  LIMIT 1;

  UPDATE account_group_members
  SET
    status = 'removed',
    updated_at = now()
  WHERE user_id = p_target_user_id
    AND status = 'active'
    AND account_group_id <> v_owner_group_id;

  INSERT INTO account_group_members (
    account_group_id,
    user_id,
    member_role,
    status,
    linked_at
  )
  VALUES (
    v_owner_group_id,
    p_target_user_id,
    'member',
    'active',
    now()
  )
  ON CONFLICT (account_group_id, user_id) DO UPDATE
  SET
    member_role = CASE
      WHEN account_group_members.member_role = 'owner' THEN account_group_members.member_role
      ELSE 'member'
    END,
    status = 'active',
    updated_at = now();

  INSERT INTO account_switch_audit_logs (
    account_group_id,
    actor_user_id,
    from_user_id,
    to_user_id,
    reason,
    metadata
  )
  VALUES (
    v_owner_group_id,
    p_owner_user_id,
    p_target_user_id,
    p_owner_user_id,
    'account_linked',
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'target_previous_group_id', v_target_previous_group_id,
      'target_user_id_verified', TRUE
    )
  );

  v_result := jsonb_build_object(
    'accountGroupId', v_owner_group_id,
    'targetUserId', p_target_user_id,
    'targetPreviousGroupId', v_target_previous_group_id,
    'linked', TRUE
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.link_account_group_member(UUID, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_account_group_member(UUID, UUID, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.link_account_group_member(UUID, UUID, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.link_account_group_member(UUID, UUID, JSONB) TO service_role;

COMMENT ON FUNCTION public.link_account_group_member(UUID, UUID, JSONB)
IS '서버에서 두 계정의 소유 확인을 마친 뒤 service_role로만 호출하는 계정 그룹 연결 함수';
