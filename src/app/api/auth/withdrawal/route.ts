import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { User } from '@supabase/supabase-js'
import {
  AccountGroupsSchemaUnavailableError,
  detachAccountGroupMembershipsForWithdrawal,
} from '@/lib/server/account-groups'
import { getSupabaseServiceRoleKey } from '@/lib/env/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization')?.trim()

  if (!authorization?.toLowerCase().startsWith('bearer ')) {
    return null
  }

  return authorization.slice('bearer '.length).trim() || null
}

async function getUserFromRequest({
  accessToken,
  admin,
}: {
  accessToken: string | null
  admin: ReturnType<typeof createAdminClient>
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (user && !userError) {
    return user
  }

  if (!accessToken) {
    return null
  }

  const {
    data: { user: tokenUser },
    error: tokenUserError,
  } = await admin.auth.getUser(accessToken)

  if (tokenUserError) {
    return null
  }

  return tokenUser
}

function deleteSupabaseCookies() {
  return cookies().then((cookieStore) => {
    cookieStore
      .getAll()
      .filter((cookie) => cookie.name.startsWith('sb-'))
      .forEach((cookie) => {
        cookieStore.delete(cookie.name)
      })
  })
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request)

  if (!getSupabaseServiceRoleKey()) {
    return NextResponse.json(
      { error: '회원 탈퇴를 처리할 서버 설정이 필요합니다.' },
      { status: 500 }
    )
  }

  const admin = createAdminClient()
  const user: User | null = await getUserFromRequest({ accessToken, admin })

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  if (accessToken) {
    await admin.auth.admin.signOut(accessToken, 'global').catch(() => null)
  }

  const supabase = await createClient()
  await supabase.auth.signOut().catch(() => null)

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

  await deleteSupabaseCookies()

  return NextResponse.json({ ok: true, withdrawnUserId: user.id })
}
