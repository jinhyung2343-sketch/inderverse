import { NextResponse } from 'next/server'
import {
  AccountGroupsSchemaUnavailableError,
  ensureViewerAccountGroup,
} from '@/lib/server/account-groups'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const accountGroup = await ensureViewerAccountGroup(user.id)
    return NextResponse.json({ ok: true, accountGroup })
  } catch (error) {
    if (error instanceof AccountGroupsSchemaUnavailableError) {
      return NextResponse.json(
        { error: '계정 그룹 서버 구조가 아직 로컬 DB에 적용되지 않았습니다.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: '계정 그룹 정보를 확인하지 못했습니다.' },
      { status: 500 }
    )
  }
}
