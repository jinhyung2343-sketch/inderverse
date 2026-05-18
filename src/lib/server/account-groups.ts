import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/lib/supabase/types'

type AccountGroup = Pick<
  Database['public']['Tables']['account_groups']['Row'],
  'id' | 'display_name' | 'status' | 'updated_at'
>
type AccountGroupMember = Pick<
  Database['public']['Tables']['account_group_members']['Row'],
  'account_group_id' | 'member_role' | 'status'
>

type AccountGroupMembershipRow = AccountGroupMember & {
  account_groups: AccountGroup | AccountGroup[] | null
}

export type ViewerAccountGroup = {
  id: string
  displayName: string
  status: string
  memberRole: string
  memberStatus: string
  updatedAt: string
}

export class AccountGroupsSchemaUnavailableError extends Error {
  constructor(message = '계정 그룹 스키마가 아직 적용되지 않았습니다.') {
    super(message)
    this.name = 'AccountGroupsSchemaUnavailableError'
  }
}

function isSchemaUnavailableError(message: string) {
  const normalizedMessage = message.toLowerCase()
  return (
    normalizedMessage.includes('account_groups') ||
    normalizedMessage.includes('account_group_members') ||
    normalizedMessage.includes('account_switch_audit_logs') ||
    normalizedMessage.includes('schema cache')
  )
}

function normalizeJoinedAccountGroup(value: AccountGroup | AccountGroup[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

function toViewerAccountGroup(row: AccountGroupMembershipRow): ViewerAccountGroup {
  const accountGroup = normalizeJoinedAccountGroup(row.account_groups)

  if (!accountGroup) {
    throw new Error('계정 그룹 정보를 찾지 못했습니다.')
  }

  return {
    id: accountGroup.id,
    displayName: accountGroup.display_name,
    status: accountGroup.status,
    memberRole: row.member_role,
    memberStatus: row.status,
    updatedAt: accountGroup.updated_at,
  }
}

async function loadViewerAccountGroup(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('account_group_members')
    .select(
      'account_group_id, member_role, status, account_groups(id, display_name, status, updated_at)'
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    if (isSchemaUnavailableError(error.message)) {
      throw new AccountGroupsSchemaUnavailableError()
    }

    throw new Error(error.message || '계정 그룹을 확인하지 못했습니다.')
  }

  return data ? toViewerAccountGroup(data as AccountGroupMembershipRow) : null
}

async function loadAccountGroupCreatedBy(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('account_groups')
    .select('id, display_name, status, updated_at')
    .eq('created_by_profile_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isSchemaUnavailableError(error.message)) {
      throw new AccountGroupsSchemaUnavailableError()
    }

    throw new Error(error.message || '계정 그룹을 확인하지 못했습니다.')
  }

  return data
}

export async function ensureViewerAccountGroup(userId: string) {
  const existingGroup = await loadViewerAccountGroup(userId)

  if (existingGroup) {
    return existingGroup
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    throw new Error(profileError.message || '프로필을 확인하지 못했습니다.')
  }

  const displayName = profile?.display_name?.trim() || '유저'
  let accountGroup: AccountGroup | null = null
  const { data: createdAccountGroup, error: groupError } = await admin
    .from('account_groups')
    .insert({
      display_name: `${displayName} 계정 그룹`,
      created_by_profile_id: userId,
    })
    .select('id, display_name, status, updated_at')
    .single()

  if (groupError) {
    if (isSchemaUnavailableError(groupError.message)) {
      throw new AccountGroupsSchemaUnavailableError()
    }

    accountGroup = await loadAccountGroupCreatedBy(userId)

    if (!accountGroup) {
      const reloadedGroup = await loadViewerAccountGroup(userId)

      if (reloadedGroup) {
        return reloadedGroup
      }
    }

    if (!accountGroup) {
      throw new Error(groupError.message || '계정 그룹을 만들지 못했습니다.')
    }
  } else {
    accountGroup = createdAccountGroup
  }

  const { data: member, error: memberError } = await admin
    .from('account_group_members')
    .insert({
      account_group_id: accountGroup.id,
      user_id: userId,
      member_role: 'owner',
    })
    .select('account_group_id, member_role, status')
    .single()

  if (memberError) {
    const reloadedGroup = await loadViewerAccountGroup(userId)

    if (reloadedGroup) {
      return reloadedGroup
    }

    throw new Error(memberError.message || '계정 그룹 멤버십을 만들지 못했습니다.')
  }

  return {
    id: accountGroup.id,
    displayName: accountGroup.display_name,
    status: accountGroup.status,
    memberRole: member.member_role,
    memberStatus: member.status,
    updatedAt: accountGroup.updated_at,
  } satisfies ViewerAccountGroup
}

export async function recordAccountSwitch({
  fromUserId,
  metadata,
  reason = 'manual_switch',
  toUserId,
}: {
  fromUserId: string | null
  metadata?: Record<string, Json>
  reason?: string
  toUserId: string
}) {
  const accountGroup = await ensureViewerAccountGroup(toUserId)

  if (!fromUserId || fromUserId === toUserId) {
    return { accountGroup, recorded: false }
  }

  const admin = createAdminClient()
  const { data: verifiedPreviousMember, error: previousMemberError } = await admin
    .from('account_group_members')
    .select('user_id')
    .eq('account_group_id', accountGroup.id)
    .eq('user_id', fromUserId)
    .eq('status', 'active')
    .maybeSingle()

  if (previousMemberError) {
    throw new Error(previousMemberError.message || '이전 계정 소속을 확인하지 못했습니다.')
  }

  const verifiedFromUserId = verifiedPreviousMember?.user_id ?? null
  const { error } = await admin
    .from('account_switch_audit_logs')
    .insert({
      account_group_id: accountGroup.id,
      actor_user_id: toUserId,
      from_user_id: verifiedFromUserId,
      to_user_id: toUserId,
      reason,
      metadata: {
        ...(metadata ?? {}),
        client_reported_from_user_id: fromUserId,
        from_user_id_verified_in_group: Boolean(verifiedFromUserId),
      },
    })

  if (error) {
    if (isSchemaUnavailableError(error.message)) {
      throw new AccountGroupsSchemaUnavailableError()
    }

    throw new Error(error.message || '계정 전환 기록을 저장하지 못했습니다.')
  }

  return { accountGroup, recorded: true }
}

export async function linkVerifiedAccountToViewerGroup({
  currentUserId,
  targetAccessToken,
  targetUserId,
  userAgent,
}: {
  currentUserId: string
  targetAccessToken: string
  targetUserId: string
  userAgent: string | null
}) {
  const trimmedAccessToken = targetAccessToken.trim()

  if (!trimmedAccessToken) {
    throw new Error('연결할 계정의 인증 정보가 없습니다.')
  }

  await ensureViewerAccountGroup(currentUserId)

  const admin = createAdminClient()
  const {
    data: { user: verifiedTargetUser },
    error: targetUserError,
  } = await admin.auth.getUser(trimmedAccessToken)

  if (targetUserError || !verifiedTargetUser) {
    throw new Error('연결할 계정의 세션이 만료되었습니다. 해당 계정으로 다시 로그인해 주세요.')
  }

  if (verifiedTargetUser.id !== targetUserId) {
    throw new Error('연결할 계정 정보가 현재 브라우저의 저장 계정과 일치하지 않습니다.')
  }

  if (verifiedTargetUser.id === currentUserId) {
    throw new Error('현재 사용 중인 계정은 다시 연결할 수 없습니다.')
  }

  const { data, error } = await admin.rpc('link_account_group_member', {
    p_metadata: {
      source: 'settings_account_registry',
      userAgent,
    },
    p_owner_user_id: currentUserId,
    p_target_user_id: verifiedTargetUser.id,
  })

  if (error) {
    if (isSchemaUnavailableError(error.message)) {
      throw new AccountGroupsSchemaUnavailableError()
    }

    throw new Error(error.message || '계정 연결을 완료하지 못했습니다.')
  }

  return data
}
