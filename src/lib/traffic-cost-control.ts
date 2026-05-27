export const TRAFFIC_COST_GUARD_VERSION = 'traffic-cost-guard-v1'

export const TRAFFIC_COST_LIMITS = {
  emergencyRetryAfterSeconds: 300,
  maxImageUploadBytes: 20 * 1024 * 1024,
  publicCatalogRevalidateSeconds: 60,
  publicCatalogStaleSeconds: 5 * 60,
  signedUploadRequestsPerMinute: 60,
} as const

export const TRAFFIC_COST_CACHE_PROFILES = {
  publicCatalog: {
    cacheControl: `public, s-maxage=${TRAFFIC_COST_LIMITS.publicCatalogRevalidateSeconds}, stale-while-revalidate=${TRAFFIC_COST_LIMITS.publicCatalogStaleSeconds}`,
    revalidateSeconds: TRAFFIC_COST_LIMITS.publicCatalogRevalidateSeconds,
  },
  publicAsset: {
    cacheControl: 'public, max-age=31536000, immutable',
  },
  privateApi: {
    cacheControl: 'no-store, max-age=0, must-revalidate',
  },
  creatorUpload: {
    cacheControl: 'no-store, max-age=0, must-revalidate',
  },
} as const

export type TrafficCostProfile = keyof typeof TRAFFIC_COST_CACHE_PROFILES

export interface TrafficCostEnvironment {
  [key: string]: string | undefined
  TRAFFIC_COST_EMERGENCY_MODE?: string
}

export type TrafficCostMode = 'normal' | 'emergency'

const CREATOR_UPLOAD_API_PREFIXES = [
  '/api/upload/',
  '/api/internal/storage-cleanup',
  '/api/internal/webtoon-image-processing',
] as const

const PRIVATE_API_PREFIXES = [
  '/api/age-verification/',
  '/api/auth/',
  '/api/coins/',
  '/api/email/',
  '/api/library/',
  '/api/spark/engagement',
  '/api/subscriptions/',
] as const

const PUBLIC_CATALOG_PREFIXES = [
  '/main',
  '/community',
  '/concept-shell',
  '/flow-preview',
] as const

export function getTrafficCostMode(env: TrafficCostEnvironment = {}): TrafficCostMode {
  return env.TRAFFIC_COST_EMERGENCY_MODE === 'enabled' ? 'emergency' : 'normal'
}

export function getTrafficCostProfileForPath(pathname: string): TrafficCostProfile {
  if (CREATOR_UPLOAD_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return 'creatorUpload'
  }

  if (PRIVATE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return 'privateApi'
  }

  if (PUBLIC_CATALOG_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return 'publicCatalog'
  }

  return 'privateApi'
}

export function buildTrafficCostHeaders(
  profile: TrafficCostProfile,
  options: {
    includeCacheControl?: boolean
  } = {}
) {
  const headers: Record<string, string> = {
    'X-Inderverse-Cost-Guard': TRAFFIC_COST_GUARD_VERSION,
    'X-Inderverse-Cost-Profile': profile,
  }

  if (options.includeCacheControl) {
    headers['Cache-Control'] = TRAFFIC_COST_CACHE_PROFILES[profile].cacheControl
  }

  return headers
}

export function getTrafficEmergencyDecision(pathname: string, env: TrafficCostEnvironment = {}) {
  if (getTrafficCostMode(env) !== 'emergency') {
    return { type: 'allow' as const }
  }

  const profile = getTrafficCostProfileForPath(pathname)

  if (profile !== 'creatorUpload') {
    return { type: 'allow' as const }
  }

  return {
    type: 'block' as const,
    message: 'Traffic cost emergency mode is limiting creator uploads temporarily.',
    profile,
    retryAfterSeconds: TRAFFIC_COST_LIMITS.emergencyRetryAfterSeconds,
    status: 503,
  }
}

export function getUploadBudgetDecision(contentLengthBytes: number | null | undefined) {
  if (!contentLengthBytes || contentLengthBytes <= TRAFFIC_COST_LIMITS.maxImageUploadBytes) {
    return { type: 'allow' as const }
  }

  return {
    type: 'block' as const,
    maxBytes: TRAFFIC_COST_LIMITS.maxImageUploadBytes,
    status: 413,
  }
}
