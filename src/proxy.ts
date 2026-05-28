import { NextResponse, type NextRequest } from 'next/server'
import { getRouteAccessDecision } from '@/lib/guest-policy'
import { updateSession } from '@/lib/supabase/middleware'
import {
  buildTrafficCostHeaders,
  getTrafficCostProfileForPath,
  getTrafficEmergencyDecision,
} from '@/lib/traffic-cost-control'

function setResponseHeaders(response: NextResponse, headers: Record<string, string>) {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
}

function isApiPath(pathname: string) {
  return pathname.startsWith('/api/')
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-') && name.includes('auth-token'))
}

function buildPassThroughResponse(request: NextRequest, pathname: string) {
  const response = NextResponse.next({ request })
  setResponseHeaders(response, buildTrafficCostHeaders(getTrafficCostProfileForPath(pathname)))

  return response
}

function handleApiRequest(request: NextRequest, pathname: string) {
  const emergencyDecision = getTrafficEmergencyDecision(pathname, process.env)
  const profile = getTrafficCostProfileForPath(pathname)

  if (emergencyDecision.type === 'block') {
    return NextResponse.json(
      { error: emergencyDecision.message },
      {
        status: emergencyDecision.status,
        headers: {
          ...buildTrafficCostHeaders(profile, { includeCacheControl: true }),
          'Retry-After': String(emergencyDecision.retryAfterSeconds),
        },
      }
    )
  }

  const response = NextResponse.next({ request })
  setResponseHeaders(response, buildTrafficCostHeaders(profile))

  return response
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const shouldDisableRouteCache =
    pathname === '/' || pathname === '/join-prompt' || pathname.startsWith('/auth/')

  if (isApiPath(pathname)) {
    return handleApiRequest(request, pathname)
  }

  const guestAccessDecision = getRouteAccessDecision({
    pathname,
    search,
    isLoggedIn: false,
  })

  if (!hasSupabaseAuthCookie(request)) {
    if (guestAccessDecision.type === 'redirect') {
      return NextResponse.redirect(new URL(guestAccessDecision.location, request.url))
    }

    const response = buildPassThroughResponse(request, pathname)

    if (shouldDisableRouteCache) {
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    }

    return response
  }

  const { response, userId, profile } = await updateSession(request)

  if (shouldDisableRouteCache) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  }

  setResponseHeaders(response, buildTrafficCostHeaders(getTrafficCostProfileForPath(pathname)))

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
