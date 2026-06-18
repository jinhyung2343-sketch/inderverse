import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { isStagingEnvironment } from '@/lib/env/app-env'
import { getSupabaseServiceRoleKey } from '@/lib/env/server'
import { resolveStoredDisplayName } from '@/lib/auth/display-name'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/types'

export const runtime = 'nodejs'

type StagingMockSignInBody = {
  email?: unknown
  password?: unknown
}

type Profile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'display_name' | 'guardian_consent_status'
>

function buildStableMockUserId(email: string) {
  const hash = createHash('sha256').update(`inderverse-staging:${email}`).digest('hex')

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-')
}

function getDisplayNameFromEmail(email: string) {
  return email.split('@')[0] || '스테이징회원'
}

async function findAuthUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  const perPage = 1000

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(error.message || '스테이징 계정 정보를 확인하지 못했습니다.')
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email)

    if (user) {
      return user
    }

    if (!data.nextPage) {
      return null
    }
  }

  return null
}

async function readStoredStagingAccount(email: string) {
  if (!getSupabaseServiceRoleKey()) {
    return null
  }

  const admin = createAdminClient()
  const user = await findAuthUserByEmail(admin, email)

  if (!user) {
    return null
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('display_name, guardian_consent_status')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(profileError.message || '스테이징 프로필 정보를 확인하지 못했습니다.')
  }

  const typedProfile = profile as Profile | null

  return {
    displayName: resolveStoredDisplayName({
      email: user.email ?? email,
      metadataDisplayName: user.user_metadata?.display_name,
      profileDisplayName: typedProfile?.display_name,
      fallback: getDisplayNameFromEmail(email),
    }),
    guardianConsentStatus:
      typedProfile?.guardian_consent_status ??
      (typeof user.user_metadata?.guardian_consent_status === 'string'
        ? user.user_metadata.guardian_consent_status
        : 'not_required'),
    userId: user.id,
  }
}

export async function POST(request: NextRequest) {
  if (!isStagingEnvironment()) {
    return NextResponse.json({ error: '스테이징 테스트 로그인만 사용할 수 있습니다.' }, { status: 404 })
  }

  let body: StagingMockSignInBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '로그인 요청 정보를 확인하지 못했습니다.' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  if (!email || password.length < 8) {
    return NextResponse.json(
      { error: '스테이징 테스트 로그인을 위해 이메일과 비밀번호 8자 이상을 입력해 주세요.' },
      { status: 400 }
    )
  }

  const createdAt = new Date().toISOString()
  let storedAccount: Awaited<ReturnType<typeof readStoredStagingAccount>> = null

  try {
    storedAccount = await readStoredStagingAccount(email)
  } catch (error) {
    console.warn('Unable to load stored staging account profile:', error)
  }

  return NextResponse.json({
    ok: true,
    mockAuth: {
      createdAt,
      displayName: storedAccount?.displayName ?? getDisplayNameFromEmail(email),
      email,
      guardianConsentStatus: storedAccount?.guardianConsentStatus ?? 'not_required',
      userId: storedAccount?.userId ?? buildStableMockUserId(email),
    },
  })
}
