import { NextResponse, type NextRequest } from 'next/server'
import { getRouteAccessDecision } from '@/lib/guest-policy'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { response, userId, profile } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  if (pathname === '/') {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  }

  const accessDecision = getRouteAccessDecision({
    pathname,
    search,
    isLoggedIn: Boolean(userId),
    userRole: profile?.role,
    guardianConsentStatus: profile?.guardian_consent_status,
  })

  if (accessDecision.type === 'redirect') {
    return NextResponse.redirect(new URL(accessDecision.location, request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
