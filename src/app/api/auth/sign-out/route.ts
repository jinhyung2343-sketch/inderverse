import { NextRequest, NextResponse } from 'next/server'
import { expireSupabaseAuthCookies } from '@/lib/auth/server-session-cookies'
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

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const accessToken = getBearerToken(request)

  await supabase.auth.signOut().catch(() => null)

  if (accessToken && getSupabaseServiceRoleKey()) {
    const admin = createAdminClient()
    await admin.auth.admin.signOut(accessToken, 'global').catch(() => null)
  }

  const response = NextResponse.json({ ok: true })
  await expireSupabaseAuthCookies(request, response)

  return response
}
