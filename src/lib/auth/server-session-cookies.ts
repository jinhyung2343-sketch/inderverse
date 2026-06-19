import 'server-only'
import { cookies } from 'next/headers'
import { type NextRequest, type NextResponse } from 'next/server'
import { collectSupabaseAuthCookieNames } from '@/lib/auth/session-cookie-names'

export async function expireSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  const cookieStore = await cookies()
  const cookieNames = collectSupabaseAuthCookieNames([
    ...request.cookies.getAll(),
    ...cookieStore.getAll(),
  ])
  const secure = request.nextUrl.protocol === 'https:'

  cookieNames.forEach((name) => {
    cookieStore.delete(name)
    response.cookies.set(name, '', {
      expires: new Date(0),
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      secure,
    })
  })
}
