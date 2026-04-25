import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from './types'

type AccessProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'role' | 'is_adult_verified'> | null

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

  let profile: AccessProfile = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, is_adult_verified')
      .eq('id', user.id)
      .maybeSingle()

    profile = data
  }

  return {
    response: supabaseResponse,
    userId: user?.id ?? null,
    profile,
  }
}
