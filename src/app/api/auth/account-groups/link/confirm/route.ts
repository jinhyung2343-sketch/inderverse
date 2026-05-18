import { NextRequest, NextResponse } from 'next/server'
import {
  AccountGroupsSchemaUnavailableError,
  linkVerifiedAccountToViewerGroup,
} from '@/lib/server/account-groups'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type LinkConfirmRequestBody = {
  targetAccessToken?: unknown
  targetUserId?: unknown
}

function normalizeRequiredString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function getReadableLinkErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  if (message.toLowerCase().includes('duplicate key')) {
    return '이미 연결된 계정입니다.'
  }

  if (message.toLowerCase().includes('expired') || message.includes('만료')) {
    return '연결할 계정의 세션이 만료되었습니다. 해당 계정으로 다시 로그인해 주세요.'
  }

  return message || '계정 연결을 완료하지 못했습니다.'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: LinkConfirmRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '계정 연결 정보를 확인하지 못했습니다.' }, { status: 400 })
  }

  const targetUserId = normalizeRequiredString(body.targetUserId)
  const targetAccessToken = normalizeRequiredString(body.targetAccessToken)

  if (!targetUserId || !targetAccessToken) {
    return NextResponse.json({ error: '연결할 계정 정보가 부족합니다.' }, { status: 400 })
  }

  try {
    const result = await linkVerifiedAccountToViewerGroup({
      currentUserId: user.id,
      targetAccessToken,
      targetUserId,
      userAgent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    if (error instanceof AccountGroupsSchemaUnavailableError) {
      return NextResponse.json(
        { error: '계정 그룹 서버 구조가 아직 로컬 DB에 적용되지 않았습니다.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: getReadableLinkErrorMessage(error) },
      { status: 400 }
    )
  }
}
