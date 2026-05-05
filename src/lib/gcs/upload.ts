import { bucket } from './client'
import { randomUUID } from 'node:crypto'

export type AllowedContentType = 'image/png' | 'image/jpeg' | 'image/webp'

export function isAllowedContentType(value: string): value is AllowedContentType {
  return value === 'image/png' || value === 'image/jpeg' || value === 'image/webp'
}

function getFileExtension(contentType: AllowedContentType) {
  return contentType.split('/')[1]
}

export function buildPublicAssetUrl(filePath: string) {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL?.trim()

  if (cdnUrl && !cdnUrl.includes('cdn.inderverse.com')) {
    return `${cdnUrl.replace(/\/$/, '')}/${filePath}`
  }

  return `https://storage.googleapis.com/${bucket.name}/${filePath}`
}

async function uploadFileToPath(file: File, filePath: string, contentType: AllowedContentType) {
  const bytes = Buffer.from(await file.arrayBuffer())

  await bucket.file(filePath).save(bytes, {
    resumable: false,
    contentType,
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  })

  return buildPublicAssetUrl(filePath)
}

export async function generateSignedUrl({
  channelId,
  episodeId,
  sortOrder,
  contentType,
}: {
  channelId: string
  episodeId: string
  sortOrder: number
  contentType: AllowedContentType
}) {
  const extension = getFileExtension(contentType)
  const filePath = `originals/${channelId}/${episodeId}/${sortOrder}.${extension}`
  
  const [url] = await bucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15분
    contentType: contentType, // Content-Type 잠금
    extensionHeaders: {
      'x-goog-content-length-range': '1,20971520', // 최대 20MB
    },
  })

  return { url, filePath, publicUrl: buildPublicAssetUrl(filePath) }
}

export async function generateSparkCoverSignedUrl({
  channelId,
  contentType,
}: {
  channelId: string
  contentType: AllowedContentType
}) {
  const extension = getFileExtension(contentType)
  const filePath = `covers/${channelId}/${Date.now()}-${randomUUID()}.${extension}`

  const [url] = await bucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
    extensionHeaders: {
      'x-goog-content-length-range': '1,20971520',
    },
  })

  return { url, filePath, publicUrl: buildPublicAssetUrl(filePath) }
}

export async function generateChannelCoverSignedUrl({
  channelId,
  contentType,
}: {
  channelId: string
  contentType: AllowedContentType
}) {
  const extension = getFileExtension(contentType)
  const filePath = `covers/${channelId}/${Date.now()}-${randomUUID()}.${extension}`

  const [url] = await bucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
    extensionHeaders: {
      'x-goog-content-length-range': '1,20971520',
    },
  })

  return { url, filePath, publicUrl: buildPublicAssetUrl(filePath) }
}

export async function generateSparkPanelSignedUrl({
  channelId,
  panelIndex,
  contentType,
}: {
  channelId: string
  panelIndex: number
  contentType: AllowedContentType
}) {
  const extension = getFileExtension(contentType)
  const filePath = `panels/${channelId}/${panelIndex + 1}-${Date.now()}-${randomUUID()}.${extension}`

  const [url] = await bucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
    extensionHeaders: {
      'x-goog-content-length-range': '1,20971520',
    },
  })

  return { url, filePath, publicUrl: buildPublicAssetUrl(filePath) }
}

export async function uploadChannelCoverFile({
  channelId,
  file,
}: {
  channelId: string
  file: File
}) {
  if (!isAllowedContentType(file.type)) {
    throw new Error('지원하지 않는 커버 이미지 형식입니다.')
  }

  const extension = getFileExtension(file.type)
  const filePath = `covers/${channelId}/${Date.now()}-${randomUUID()}.${extension}`

  return uploadFileToPath(file, filePath, file.type)
}

export async function uploadSparkCoverFile({
  channelId,
  file,
}: {
  channelId: string
  file: File
}) {
  if (!isAllowedContentType(file.type)) {
    throw new Error('지원하지 않는 커버 이미지 형식입니다.')
  }

  const extension = getFileExtension(file.type)
  const filePath = `covers/${channelId}/${Date.now()}-${randomUUID()}.${extension}`

  return uploadFileToPath(file, filePath, file.type)
}

export async function uploadSparkPanelFile({
  channelId,
  panelIndex,
  file,
}: {
  channelId: string
  panelIndex: number
  file: File
}) {
  if (!isAllowedContentType(file.type)) {
    throw new Error('지원하지 않는 컷 이미지 형식입니다.')
  }

  const extension = getFileExtension(file.type)
  const filePath = `panels/${channelId}/${panelIndex + 1}-${Date.now()}-${randomUUID()}.${extension}`

  return uploadFileToPath(file, filePath, file.type)
}

export async function uploadEpisodeImageFile({
  channelId,
  episodeId,
  sortOrder,
  file,
}: {
  channelId: string
  episodeId: string
  sortOrder: number
  file: File
}) {
  if (!isAllowedContentType(file.type)) {
    throw new Error('지원하지 않는 회차 이미지 형식입니다.')
  }

  const extension = getFileExtension(file.type)
  const filePath = `originals/${channelId}/${episodeId}/${sortOrder}.${extension}`

  return uploadFileToPath(file, filePath, file.type)
}
