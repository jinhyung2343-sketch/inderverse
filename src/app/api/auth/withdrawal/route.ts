import { NextResponse } from 'next/server'
import {
  AccountGroupsSchemaUnavailableError,
  detachAccountGroupMembershipsForWithdrawal,
} from '@/lib/server/account-groups'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json(
      { error: '회원 탈퇴를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: error.status ?? 500 }
    )
  }

  try {
    await detachAccountGroupMembershipsForWithdrawal(user.id)
  } catch (error) {
    if (!(error instanceof AccountGroupsSchemaUnavailableError)) {
      console.warn('Failed to clean withdrawn account group memberships:', error)
    }
  }

  await supabase.auth.signOut()

  return NextResponse.json({ ok: true, withdrawnUserId: user.id })
}
