import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { isStagingEnvironment } from '@/lib/env/app-env'

export const runtime = 'nodejs'

type StagingMockSignInBody = {
  email?: unknown
  password?: unknown
}

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

  return NextResponse.json({
    ok: true,
    mockAuth: {
      createdAt,
      displayName: getDisplayNameFromEmail(email),
      email,
      guardianConsentStatus: 'not_required',
      userId: buildStableMockUserId(email),
    },
  })
}
