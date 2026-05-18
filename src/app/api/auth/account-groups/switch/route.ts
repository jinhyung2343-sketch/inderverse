import { NextRequest, NextResponse } from 'next/server'
import {
  AccountGroupsSchemaUnavailableError,
  recordAccountSwitch,
} from '@/lib/server/account-groups'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type SwitchRequestBody = {
  fromUserId?: unknown
  toUserId?: unknown
}

function normalizeUserId(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
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

  let body: SwitchRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '계정 전환 정보를 확인하지 못했습니다.' }, { status: 400 })
  }

  const fromUserId = normalizeUserId(body.fromUserId)
  const toUserId = normalizeUserId(body.toUserId)

  if (!toUserId || toUserId !== user.id) {
    return NextResponse.json({ error: '현재 접속 계정과 전환 대상이 일치하지 않습니다.' }, { status: 403 })
  }

  try {
    const result = await recordAccountSwitch({
      fromUserId,
      toUserId,
      metadata: {
        source: 'settings_account_registry',
        userAgent: request.headers.get('user-agent') ?? null,
      },
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof AccountGroupsSchemaUnavailableError) {
      return NextResponse.json(
        { error: '계정 그룹 서버 구조가 아직 로컬 DB에 적용되지 않았습니다.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: '계정 전환 기록을 저장하지 못했습니다.' },
      { status: 500 }
    )
  }
}
