import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { response, userId, profile } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    return response
  }

  const isAuthPage = pathname === '/join-prompt' || pathname.startsWith('/auth/')
  const isGuardianConsentPage = pathname === '/main/guardian-consent'
  const isCreatorAgreementPage = pathname === '/main/studio/creator-agreement'
  const isCreatorPage = pathname.startsWith('/main/studio/')
  const isAdminPage = pathname.startsWith('/admin')
  const isLoggedIn = Boolean(userId)
  const isCreator = profile?.role === 'creator' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'
  const isGuardianPending = profile?.guardian_consent_status === 'pending'

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/main', request.url))
  }

  if ((isCreatorPage || isAdminPage) && !isLoggedIn) {
    const redirectUrl = new URL('/join-prompt', request.url)
    redirectUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(redirectUrl)
  }

  if (
    isGuardianPending &&
    !isGuardianConsentPage &&
    (pathname.startsWith('/main/store') || pathname.startsWith('/main/studio'))
  ) {
    return NextResponse.redirect(new URL('/main/guardian-consent', request.url))
  }

  if (isCreatorPage && !isCreator && !isCreatorAgreementPage) {
    return NextResponse.redirect(new URL('/main?denied=creator', request.url))
  }

  if (isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL('/main?denied=admin', request.url))
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
