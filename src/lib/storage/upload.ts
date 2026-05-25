import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { createAdminClient } from '@/lib/supabase/admin'

export type AllowedContentType = 'image/png' | 'image/jpeg' | 'image/webp'

export const SUPABASE_ASSET_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'artwork-assets'
export const MAX_IMAGE_FILE_BYTES = 20 * 1024 * 1024
const COVER_IMAGE_WIDTH = 1200
const COVER_IMAGE_WEBP_QUALITY = 85
const WEBTOON_READER_WIDTH = 1600
const WEBTOON_THUMBNAIL_WIDTH = 480

export interface SupabaseSignedUpload {
  bucket: string
  filePath: string
  publicUrl: string
  token: string
  url: string
  maxFileBytes?: number
}

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

function getStorage() {
  return createAdminClient().storage.from(SUPABASE_ASSET_BUCKET)
}

export function buildPublicAssetUrl(filePath: string) {
  return getStorage().getPublicUrl(filePath).data.publicUrl
}

async function uploadBufferToPath(bytes: Buffer, filePath: string, contentType: AllowedContentType) {
  if (bytes.length > MAX_IMAGE_FILE_BYTES) {
    throw new Error('이미지 파일은 20MB 이하로 업로드해 주세요.')
  }

  const { error } = await getStorage().upload(filePath, bytes, {
    contentType,
    cacheControl: '31536000',
    upsert: true,
  })

  if (error) {
    throw new Error(error.message)
  }

  return buildPublicAssetUrl(filePath)
}

async function uploadFileToPath(file: File, filePath: string, contentType: AllowedContentType) {
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error('이미지 파일은 20MB 이하로 업로드해 주세요.')
  }

  return uploadBufferToPath(Buffer.from(await file.arrayBuffer()), filePath, contentType)
}

async function downloadBuffer(filePath: string) {
  const { data, error } = await getStorage().download(filePath)

  if (error || !data) {
    throw new Error(error?.message || '이미지 원본을 찾지 못했습니다.')
  }

  return Buffer.from(await data.arrayBuffer())
}

async function deleteFileIfExists(filePath: string | null) {
  if (!filePath) {
    return
  }

  const { error } = await getStorage().remove([filePath])

  if (error && !error.message.toLowerCase().includes('not found')) {
    throw new Error(error.message)
  }
}

async function buildWebtoonDerivative(sourceBytes: Buffer, width: number, quality: number) {
  return sharp(sourceBytes, { limitInputPixels: false })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true })
}

async function createSignedUpload(filePath: string): Promise<SupabaseSignedUpload> {
  const { data, error } = await getStorage().createSignedUploadUrl(filePath)

  if (error || !data) {
    throw new Error(error?.message || '업로드용 주소를 만들지 못했습니다.')
  }

  return {
    bucket: SUPABASE_ASSET_BUCKET,
    filePath,
    publicUrl: buildPublicAssetUrl(filePath),
    token: data.token,
    url: data.signedUrl,
    maxFileBytes: MAX_IMAGE_FILE_BYTES,
  }
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
  const thumbnailPath = `thumbnails/${channelId}/${episodeId}/${sortOrder}-${randomUUID()}.webp`
  const optimized = await buildWebtoonDerivative(originalBytes, WEBTOON_READER_WIDTH, 88)
  const thumbnail = await buildWebtoonDerivative(originalBytes, WEBTOON_THUMBNAIL_WIDTH, 76)
  let optimizedImageUrl: string | null = null
  let thumbnailImageUrl: string | null = null

  try {
    optimizedImageUrl = await uploadBufferToPath(optimized.data, optimizedPath, 'image/webp')
    thumbnailImageUrl = await uploadBufferToPath(thumbnail.data, thumbnailPath, 'image/webp')
  } catch (error) {
    await Promise.all([
      deleteFileIfExists(optimizedImageUrl ? optimizedPath : null),
      deleteFileIfExists(thumbnailImageUrl ? thumbnailPath : null),
    ])
    throw error
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
      optimized: {
        url: optimizedImageUrl,
        filePath: optimizedPath,
        width: optimized.info.width || null,
        height: optimized.info.height || null,
        fileSizeBytes: optimized.data.length,
        contentType: 'image/webp',
      },
      thumbnail: {
        url: thumbnailImageUrl,
        filePath: thumbnailPath,
        width: thumbnail.info.width || null,
        height: thumbnail.info.height || null,
        fileSizeBytes: thumbnail.data.length,
        contentType: 'image/webp',
      },
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
  const originalBytes = await downloadBuffer(originalFilePath)
  const candidateContentType = contentType ?? ''
  const normalizedContentType = isAllowedContentType(candidateContentType)
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
  return createSignedUpload(`originals/${channelId}/${episodeId}/${sortOrder}-${randomUUID()}.${extension}`)
}

export async function generateSparkCoverSignedUrl({
  channelId,
  contentType,
}: {
  channelId: string
  contentType: AllowedContentType
}) {
  const extension = getFileExtension(contentType)
  return createSignedUpload(`covers/${channelId}/${Date.now()}-${randomUUID()}.${extension}`)
}

export async function generateChannelCoverSignedUrl(args: {
  channelId: string
  contentType: AllowedContentType
}) {
  return generateSparkCoverSignedUrl(args)
}

export async function generateDraftChannelCoverSignedUrl({
  userId,
  contentType,
}: {
  userId: string
  contentType: AllowedContentType
}) {
  const extension = getFileExtension(contentType)
  return createSignedUpload(`covers/drafts/${userId}/${Date.now()}-${randomUUID()}.${extension}`)
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
  return createSignedUpload(
    `creator-channels/${creatorChannelId}/${imageRole}/${Date.now()}-${randomUUID()}.${extension}`
  )
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
  return createSignedUpload(`panels/${channelId}/${panelIndex + 1}-${Date.now()}-${randomUUID()}.${extension}`)
}

async function uploadCoverFile({ channelId, file }: { channelId: string; file: File }) {
  if (!isAllowedContentType(file.type)) {
    throw new Error('지원하지 않는 커버 이미지 형식입니다.')
  }

  const sourceBytes = Buffer.from(await file.arrayBuffer())
  const optimizedCover = await sharp(sourceBytes, { limitInputPixels: false })
    .rotate()
    .resize({ width: COVER_IMAGE_WIDTH, withoutEnlargement: true })
    .webp({ quality: COVER_IMAGE_WEBP_QUALITY, effort: 4 })
    .toBuffer({ resolveWithObject: true })

  const filePath = `covers/${channelId}/${Date.now()}-${randomUUID()}.webp`
  return uploadBufferToPath(optimizedCover.data, filePath, 'image/webp')
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
  return uploadFileToPath(file, `panels/${channelId}/${panelIndex + 1}-${Date.now()}-${randomUUID()}.${extension}`, file.type)
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
