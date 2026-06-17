import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getSupabaseServiceRoleKey } from '@/lib/env/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export const runtime = 'nodejs'

type Profile = Database['public']['Tables']['profiles']['Row']

function readDisplayName(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization')?.trim()

  if (!authorization?.toLowerCase().startsWith('bearer ')) {
    return ''
  }

  return authorization.slice('bearer '.length).trim()
}

async function getCurrentUser(request: NextRequest, admin: ReturnType<typeof createAdminClient> | null) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (user && !error) {
    return user
  }

  const bearerToken = getBearerToken(request)

  if (!bearerToken || !admin) {
    return null
  }

  const {
    data: { user: bearerUser },
    error: bearerError,
  } = await admin.auth.getUser(bearerToken)

  if (bearerError) {
    return null
  }

  return bearerUser
}

function resolveDisplayName(user: User, profile: Profile | null) {
  const metadataDisplayName = readDisplayName(user.user_metadata?.display_name)
  const profileDisplayName = readDisplayName(profile?.display_name)
  const emailLocalPart = user.email?.split('@')[0] ?? ''

  if (
    metadataDisplayName &&
    (!profileDisplayName ||
      profileDisplayName === user.email ||
      profileDisplayName === emailLocalPart)
  ) {
    return metadataDisplayName
  }

  return profileDisplayName || metadataDisplayName || emailLocalPart || '유저'
}

export async function GET(request: NextRequest) {
  const canUseAdmin = Boolean(getSupabaseServiceRoleKey())
  const admin = canUseAdmin ? createAdminClient() : null
  const user = await getCurrentUser(request, admin)

  if (!user) {
    return NextResponse.json({ profile: null }, { status: 401 })
  }

  const profileResult = admin
    ? await admin.from('profiles').select('*').eq('id', user.id).maybeSingle()
    : await (await createClient()).from('profiles').select('*').eq('id', user.id).maybeSingle()

  if (profileResult.error) {
    return NextResponse.json(
      { error: '프로필 정보를 확인하지 못했습니다.' },
      { status: 500 }
    )
  }

  const displayName = resolveDisplayName(user, profileResult.data)
  let profile = profileResult.data

  if (admin) {
    const profileNeedsSync = !profile || readDisplayName(profile.display_name) !== displayName

    if (profileNeedsSync) {
      const { data: syncedProfile, error: syncError } = await admin
        .from('profiles')
        .upsert(
          {
            id: user.id,
            display_name: displayName,
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single()

      if (syncError) {
        return NextResponse.json(
          { error: '프로필 표시명을 동기화하지 못했습니다.' },
          { status: 500 }
        )
      }

      profile = syncedProfile
    }

    if (readDisplayName(user.user_metadata?.display_name) !== displayName) {
      await admin.auth.admin
        .updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            display_name: displayName,
          },
        })
        .catch(() => null)
    }
  }

  return NextResponse.json({
    displayName,
    profile,
  })
}
