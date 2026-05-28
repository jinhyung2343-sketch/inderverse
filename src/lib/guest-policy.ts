export const LOGIN_REQUIRED_MESSAGE = '이 서비스는 로그인이 필요합니다.'
export const GUARDIAN_CONSENT_REQUIRED_MESSAGE = '보호자 동의 확인 후 사용할 수 있습니다.'
export const CREATOR_REQUIRED_MESSAGE = '작가 등록 후 사용할 수 있습니다.'

export type AccessControlledRole = 'reader' | 'creator' | 'admin' | string | null | undefined

export type RouteAccessContext = {
  pathname: string
  search?: string
  isLoggedIn: boolean
  userRole?: AccessControlledRole
  guardianConsentStatus?: string | null
}

export type RouteAccessDecision =
  | { type: 'allow' }
  | { type: 'redirect'; location: string; reason: 'login_required' | 'guardian_pending' | 'creator_required' | 'admin_required' | 'already_logged_in' }

const guestAllowedMainMenuIds = ['explore', 'creators', 'spark', 'community', 'library', 'store', 'studio']
const loginRequiredMainPaths = ['/main/store/checkout']

export function canGuestOpenMainMenu(menuId: string) {
  return guestAllowedMainMenuIds.includes(menuId)
}

export function sanitizeInternalPath(path: string | null | undefined, fallback = '/main') {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return fallback
  }

  return path
}

export function getJoinPromptHref(nextPath: string) {
  return `/join-prompt?next=${encodeURIComponent(sanitizeInternalPath(nextPath))}`
}

export function getForcedJoinPromptHref(nextPath: string) {
  return `${getJoinPromptHref(nextPath)}&force=1`
}

function getSearchParams(search: string) {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
}

function getPathWithSearch(pathname: string, search = '') {
  return `${pathname}${search}`
}

function matchesPathOrChild(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}

export function getRouteAccessDecision({
  pathname,
  search = '',
  isLoggedIn,
  userRole,
  guardianConsentStatus,
}: RouteAccessContext): RouteAccessDecision {
  if (pathname.startsWith('/api/')) {
    return { type: 'allow' }
  }

  const isGuardianConsentPage = pathname === '/main/guardian-consent'
  const isJoinPromptPage = pathname === '/join-prompt'
  const isCreatorAgreementPage = pathname === '/main/studio/creator-agreement'
  const isLoginRequiredPage = loginRequiredMainPaths.some((path) =>
    matchesPathOrChild(pathname, path)
  )
  const isCreatorPage = pathname.startsWith('/main/studio/')
  const isAdminPage = pathname.startsWith('/admin')
  const isCreator = userRole === 'creator' || userRole === 'admin'
  const isAdmin = userRole === 'admin'
  const isGuardianPending = guardianConsentStatus === 'pending'
  const shouldForceJoinPrompt = isJoinPromptPage && getSearchParams(search).get('force') === '1'

  if (isJoinPromptPage && isLoggedIn && !shouldForceJoinPrompt) {
    return { type: 'redirect', location: '/main', reason: 'already_logged_in' }
  }

  if ((isLoginRequiredPage || isCreatorPage || isAdminPage) && !isLoggedIn) {
    return {
      type: 'redirect',
      location: getJoinPromptHref(getPathWithSearch(pathname, search)),
      reason: 'login_required',
    }
  }

  if (
    isGuardianPending &&
    !isGuardianConsentPage &&
    (pathname.startsWith('/main/store') || pathname.startsWith('/main/studio'))
  ) {
    return { type: 'redirect', location: '/main/guardian-consent', reason: 'guardian_pending' }
  }

  if (isCreatorPage && !isCreator && !isCreatorAgreementPage) {
    return { type: 'redirect', location: '/main?denied=creator', reason: 'creator_required' }
  }

  if (isAdminPage && !isAdmin) {
    return { type: 'redirect', location: '/main?denied=admin', reason: 'admin_required' }
  }

  return { type: 'allow' }
}
