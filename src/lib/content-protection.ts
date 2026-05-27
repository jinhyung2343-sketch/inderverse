export const CONTENT_PROTECTION_VERSION = 'reader-protection-v1'

export const PROTECTED_IMAGE_ROUTE_PREFIX = '/api/content/images'

export const contentProtectionPolicy = {
  auditAccessEvents: false,
  blockImageDrag: true,
  blurWhenHidden: true,
  disableContextMenu: true,
  protectedImageRouteEnabled: process.env.NEXT_PUBLIC_CONTENT_PROTECTION_IMAGE_ROUTE === 'enabled',
  visibleWatermark: true,
} as const

export interface ContentProtectionContext {
  artworkId: string
  episodeId: string
  viewerId?: string | null
  viewerLabel?: string | null
}

export interface ProtectedImageUrlInput {
  artworkId: string
  episodeId: string
  imageUrl: string
  index: number
  storagePath?: string | null
}

export function getReaderViewerLabel({
  viewerId,
  viewerLabel,
}: Pick<ContentProtectionContext, 'viewerId' | 'viewerLabel'>) {
  const normalizedLabel = viewerLabel?.trim()

  if (normalizedLabel) {
    return normalizedLabel
  }

  if (viewerId) {
    return `user:${viewerId.slice(0, 8)}`
  }

  return 'guest'
}

export function buildReaderWatermark(context: ContentProtectionContext) {
  const viewer = getReaderViewerLabel(context)

  return `Inderverse · ${viewer} · ${context.artworkId}/${context.episodeId}`
}

export function getProtectedImageUrl({
  artworkId,
  episodeId,
  imageUrl,
  index,
  storagePath,
}: ProtectedImageUrlInput) {
  if (!contentProtectionPolicy.protectedImageRouteEnabled || !storagePath) {
    return imageUrl
  }

  const params = new URLSearchParams({
    artworkId,
    episodeId,
    image: String(index + 1),
  })

  return `${PROTECTED_IMAGE_ROUTE_PREFIX}/${encodeURIComponent(storagePath)}?${params.toString()}`
}

export function getProtectedContentResponseHeaders() {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    'Referrer-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
  } as const
}
