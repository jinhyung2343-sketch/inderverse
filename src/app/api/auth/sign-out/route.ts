import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServiceRoleKey } from '@/lib/env/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function isSupabaseCookie(name: string) {
  return name.startsWith('sb-')
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization')?.trim()

  if (!authorization?.toLowerCase().startsWith('bearer ')) {
    return null
  }

  return authorization.slice('bearer '.length).trim() || null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const accessToken = getBearerToken(request)

  await supabase.auth.signOut().catch(() => null)

  if (accessToken && getSupabaseServiceRoleKey()) {
    const admin = createAdminClient()
    await admin.auth.admin.signOut(accessToken, 'global').catch(() => null)
  }

  const cookieStore = await cookies()

  cookieStore
    .getAll()
    .filter((cookie) => isSupabaseCookie(cookie.name))
    .forEach((cookie) => {
      cookieStore.delete(cookie.name)
    })

  return NextResponse.json({ ok: true })
}
