import { bucket } from './client'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

export type AllowedContentType = 'image/png' | 'image/jpeg' | 'image/webp'

const MAX_IMAGE_FILE_BYTES = 20 * 1024 * 1024
const WEBTOON_READER_WIDTH = 1600
const WEBTOON_THUMBNAIL_WIDTH = 480

export interface UploadedEpisodeImage {
  imageUrl: string
  originalImageUrl: string
  optimizedImageUrl: string | null
  thumbnailImageUrl: string | null
  width: number | null
  height: number | null
  fileSizeBytes: number
  contentType: AllowedContentType
  processingStatus: 'ready' | 'partial'
  processingError: string | null
  cleanupStatus: 'active'
  originalFilePath: string
  optimizedFilePath: string | null
  thumbnailFilePath: string | null
  derivatives: {
    original: ImageDerivativeMetadata
    optimized: ImageDerivativeMetadata | null
    thumbnail: ImageDerivativeMetadata | null
  }
}

export interface ImageDerivativeMetadata {
  url: string
  filePath: string
  width: number | null
  height: number | null
  fileSizeBytes: number
  contentType: AllowedContentType
}

export interface WebtoonDerivativeProcessingResult {
  imageUrl: string
  originalImageUrl: string
  optimizedImageUrl: string
  thumbnailImageUrl: string
  width: number | null
  height: number | null
  fileSizeBytes: number
  contentType: AllowedContentType
  processingStatus: 'ready'
  processingError: null
  cleanupStatus: 'active'
  originalFilePath: string
  optimizedFilePath: string
  thumbnailFilePath: string
  derivatives: UploadedEpisodeImage['derivatives']
}

export function isAllowedContentType(value: string): value is AllowedContentType {
  return value === 'image/png' || value === 'image/jpeg' || value === 'image/webp'
}

function getFileExtension(contentType: AllowedContentType) {
  return contentType.split('/')[1]
}

function inferContentTypeFromPath(filePath: string): AllowedContentType {
  const extension = filePath.split('.').pop()?.toLowerCase()

  if (extension === 'png') {
    return 'image/png'
  }

  if (extension === 'webp') {
    return 'image/webp'
  }

  return 'image/jpeg'
}

export function buildPublicAssetUrl(filePath: string) {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL?.trim()

  if (cdnUrl && !cdnUrl.includes('cdn.inderverse.com')) {
    return `${cdnUrl.replace(/\/$/, '')}/${filePath}`
  }

  return `https://storage.googleapis.com/${bucket.name}/${filePath}`
}

async function uploadFileToPath(file: File, filePath: string, contentType: AllowedContentType) {
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error('이미지 파일은 20MB 이하로 업로드해 주세요.')
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  return uploadBufferToPath(bytes, filePath, contentType)
}

async function uploadBufferToPath(bytes: Buffer, filePath: string, contentType: AllowedContentType) {
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

async function deleteFileIfExists(filePath: string | null) {
  if (!filePath) {
    return
  }

  try {
    await bucket.file(filePath).delete()
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 404) {
      return
    }

    throw error
  }
}

async function buildWebtoonDerivative(
  sourceBytes: Buffer,
  width: number,
  quality: number
) {
  return sharp(sourceBytes, { limitInputPixels: false })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true })
}

export async function buildAndUploadWebtoonEpisodeDerivatives({
  channelId,
  episodeId,
  sortOrder,
  originalBytes,
  originalFilePath,
  originalImageUrl,
  contentType,
}: {
  channelId: string
  episodeId: string
  sortOrder: number
  originalBytes: Buffer
  originalFilePath: string
  originalImageUrl: string
  contentType: AllowedContentType
}): Promise<WebtoonDerivativeProcessingResult> {
  const originalMetadata = await sharp(originalBytes, { limitInputPixels: false }).metadata()
  const originalWidth = originalMetadata.width ?? null
  const originalHeight = originalMetadata.height ?? null
  const optimizedPath = `optimized/${channelId}/${episodeId}/${sortOrder}-${randomUUID()}.webp`
  const optimized = await buildWebtoonDerivative(originalBytes, WEBTOON_READER_WIDTH, 88)
  const thumbnailPath = `thumbnails/${channelId}/${episodeId}/${sortOrder}-${randomUUID()}.webp`
  const thumbnail = await buildWebtoonDerivative(originalBytes, WEBTOON_THUMBNAIL_WIDTH, 76)
  let optimizedImageUrl: string | null = null
  let thumbnailImageUrl: string | null = null

  try {
    optimizedImageUrl = await uploadBufferToPath(optimized.data, optimizedPath, 'image/webp')
    thumbnailImageUrl = await uploadBufferToPath(thumbnail.data, thumbnailPath, 'image/webp')
  } catch (error) {
    await Promise.all([deleteFileIfExists(optimizedImageUrl ? optimizedPath : null), deleteFileIfExists(thumbnailImageUrl ? thumbnailPath : null)])
    throw error
  }

  const optimizedDerivative: ImageDerivativeMetadata = {
    url: optimizedImageUrl,
    filePath: optimizedPath,
    width: optimized.info.width || null,
    height: optimized.info.height || null,
    fileSizeBytes: optimized.data.length,
    contentType: 'image/webp',
  }
  const thumbnailDerivative: ImageDerivativeMetadata = {
    url: thumbnailImageUrl,
    filePath: thumbnailPath,
    width: thumbnail.info.width || null,
    height: thumbnail.info.height || null,
    fileSizeBytes: thumbnail.data.length,
    contentType: 'image/webp',
  }

  return {
    imageUrl: optimizedImageUrl,
    originalImageUrl,
    optimizedImageUrl,
    thumbnailImageUrl,
    width: originalWidth,
    height: originalHeight,
    fileSizeBytes: originalBytes.length,
    contentType,
    processingStatus: 'ready',
    processingError: null,
    cleanupStatus: 'active',
    originalFilePath,
    optimizedFilePath: optimizedPath,
    thumbnailFilePath: thumbnailPath,
    derivatives: {
      original: {
        url: originalImageUrl,
        filePath: originalFilePath,
        width: originalWidth,
        height: originalHeight,
        fileSizeBytes: originalBytes.length,
        contentType,
      },
      optimized: optimizedDerivative,
      thumbnail: thumbnailDerivative,
    },
  }
}

export async function regenerateWebtoonEpisodeDerivatives({
  channelId,
  episodeId,
  sortOrder,
  originalFilePath,
  originalImageUrl,
  contentType,
}: {
  channelId: string
  episodeId: string
  sortOrder: number
  originalFilePath: string
  originalImageUrl?: string | null
  contentType?: string | null
}) {
  const [originalBytes] = await bucket.file(originalFilePath).download()
  const candidateContentType = contentType ?? ''
  const normalizedContentType: AllowedContentType = isAllowedContentType(candidateContentType)
    ? candidateContentType
    : inferContentTypeFromPath(originalFilePath)

  return buildAndUploadWebtoonEpisodeDerivatives({
    channelId,
    episodeId,
    sortOrder,
    originalBytes,
    originalFilePath,
    originalImageUrl: originalImageUrl ?? buildPublicAssetUrl(originalFilePath),
    contentType: normalizedContentType,
  })
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

export async function generateCreatorChannelImageSignedUrl({
  creatorChannelId,
  imageRole,
  contentType,
}: {
  creatorChannelId: string
  imageRole: 'avatar' | 'cover'
  contentType: AllowedContentType
}) {
  const extension = getFileExtension(contentType)
  const filePath = `creator-channels/${creatorChannelId}/${imageRole}/${Date.now()}-${randomUUID()}.${extension}`

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

async function uploadCoverFile({
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

export async function uploadChannelCoverFile(args: { channelId: string; file: File }) {
  return uploadCoverFile(args)
}

export async function uploadSparkCoverFile(args: { channelId: string; file: File }) {
  return uploadCoverFile(args)
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

  if (file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error('이미지 파일은 20MB 이하로 업로드해 주세요.')
  }

  const extension = getFileExtension(file.type)
  const originalPath = `originals/${channelId}/${episodeId}/${sortOrder}-${randomUUID()}.${extension}`
  const originalBytes = Buffer.from(await file.arrayBuffer())
  const originalMetadata = await sharp(originalBytes, { limitInputPixels: false }).metadata()
  const originalImageUrl = await uploadBufferToPath(originalBytes, originalPath, file.type)
  let processingStatus: UploadedEpisodeImage['processingStatus'] = 'ready'
  let processingError: string | null = null

  try {
    return await buildAndUploadWebtoonEpisodeDerivatives({
      channelId,
      episodeId,
      sortOrder,
      originalBytes,
      originalFilePath: originalPath,
      originalImageUrl,
      contentType: file.type,
    })
  } catch (error) {
    processingStatus = 'partial'
    processingError = error instanceof Error ? error.message : '이미지 파생본 생성에 실패했습니다.'
    console.warn('Webtoon image derivative generation failed:', {
      channelId,
      episodeId,
      sortOrder,
      message: processingError,
    })
  }

  const originalWidth = originalMetadata.width ?? null
  const originalHeight = originalMetadata.height ?? null

  return {
    imageUrl: originalImageUrl,
    originalImageUrl,
    optimizedImageUrl: null,
    thumbnailImageUrl: null,
    width: originalWidth,
    height: originalHeight,
    fileSizeBytes: file.size,
    contentType: file.type,
    processingStatus,
    processingError,
    cleanupStatus: 'active',
    originalFilePath: originalPath,
    optimizedFilePath: null,
    thumbnailFilePath: null,
    derivatives: {
      original: {
        url: originalImageUrl,
        filePath: originalPath,
        width: originalWidth,
        height: originalHeight,
        fileSizeBytes: file.size,
        contentType: file.type,
      },
      optimized: null,
      thumbnail: null,
    },
  } satisfies UploadedEpisodeImage
}
