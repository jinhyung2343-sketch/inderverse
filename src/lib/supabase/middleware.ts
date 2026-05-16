import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from './types'

type AccessProfile = {
  role: Database['public']['Tables']['profiles']['Row']['role'] | null
  is_adult_verified: boolean
  guardian_consent_status: Database['public']['Tables']['profiles']['Row']['guardian_consent_status'] | null
} | null

function readRoleClaim(value: unknown): NonNullable<AccessProfile>['role'] {
  return value === 'reader' || value === 'creator' || value === 'admin' ? value : null
}

function readStringClaim(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function getAccessProfileFromJwt(user: User | null): AccessProfile {
  if (!user) {
    return null
  }

  return {
    role: readRoleClaim(user.app_metadata?.role ?? user.user_metadata?.role),
    is_adult_verified: user.app_metadata?.is_adult_verified === true ||
      user.user_metadata?.is_adult_verified === true,
    guardian_consent_status: readStringClaim(
      user.app_metadata?.guardian_consent_status ?? user.user_metadata?.guardian_consent_status
    ),
  }
}

export type SessionContext = {
  response: NextResponse
  userId: string | null
  profile: AccessProfile
}

export async function updateSession(request: NextRequest): Promise<SessionContext> {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not wrap this in a try/catch block.
  // We want to perform a database call to refresh the session naturally.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profile = getAccessProfileFromJwt(user ?? null)

  return {
    response: supabaseResponse,
    userId: user?.id ?? null,
    profile,
  }
}
