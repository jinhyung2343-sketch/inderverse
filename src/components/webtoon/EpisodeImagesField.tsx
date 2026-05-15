'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FilePickerButton, ImageUploadDropzone } from '@/components/upload/ImageUploadDropzone'
import {
  IMAGE_UPLOAD_POLICY,
  formatFileSize,
  getWebtoonUploadGuide,
  prepareAndInspectImageFiles,
} from '@/lib/image-upload-policy'
import type { WebtoonEpisodeImageRecord } from '@/lib/webtoon'

type ImageUploadStatus = 'empty' | 'pending' | 'uploading' | 'ready' | 'failed'
type DiagnosticLevel = 'pass' | 'warning' | 'error'

interface ImageDiagnosticItem {
  level: DiagnosticLevel
  title: string
  message: string
}

interface EpisodeImageDraft {
  imageUrl: string
  originalImageUrl: string | null
  optimizedImageUrl: string | null
  thumbnailImageUrl: string | null
  sortOrder: number
  width: number | null
  height: number | null
  fileSizeBytes: number | null
  contentType: string | null
  derivatives: WebtoonEpisodeImageRecord['derivatives']
  isVerified: boolean
  processingStatus: string | null
  processingError: string | null
  cleanupStatus: string | null
  originalFilePath: string | null
  optimizedFilePath: string | null
  thumbnailFilePath: string | null
  status: ImageUploadStatus
  errorMessage: string | null
  pendingFile: File | null
}

interface EpisodeUploadPayload {
  imageUrl: string
  originalImageUrl?: string | null
  optimizedImageUrl?: string | null
  thumbnailImageUrl?: string | null
  width?: number | null
  height?: number | null
  fileSizeBytes?: number | null
  contentType?: string | null
  derivatives?: WebtoonEpisodeImageRecord['derivatives']
  processingStatus?: string | null
  processingError?: string | null
  cleanupStatus?: string | null
  originalFilePath?: string | null
  optimizedFilePath?: string | null
  thumbnailFilePath?: string | null
  isVerified?: boolean
}

function normalizeImages(initialImages: WebtoonEpisodeImageRecord[]) {
  if (initialImages.length === 0) {
    return [createEmptyImageDraft(0)]
  }

  return initialImages
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image, index) => ({
      imageUrl: image.imageUrl,
      originalImageUrl: image.originalImageUrl ?? null,
      optimizedImageUrl: image.optimizedImageUrl ?? null,
      thumbnailImageUrl: image.thumbnailImageUrl ?? null,
      sortOrder: index,
      width: image.width ?? null,
      height: image.height ?? null,
      fileSizeBytes: image.fileSizeBytes ?? null,
      contentType: image.contentType ?? null,
      derivatives: image.derivatives ?? null,
      isVerified: image.isVerified ?? false,
      processingStatus: image.processingStatus ?? 'ready',
      processingError: image.processingError ?? null,
      cleanupStatus: image.cleanupStatus ?? 'active',
      originalFilePath: image.originalFilePath ?? null,
      optimizedFilePath: image.optimizedFilePath ?? null,
      thumbnailFilePath: image.thumbnailFilePath ?? null,
      status: image.imageUrl ? 'ready' as const : 'empty' as const,
      errorMessage: null,
      pendingFile: null,
    }))
}

function normalizeDraftImages(draftImages: Partial<EpisodeImageDraft>[]) {
  const normalized = draftImages
    .filter((image) => typeof image.imageUrl === 'string' || image.pendingFile === null)
    .map((image, index) => {
      const imageUrl = typeof image.imageUrl === 'string' && !image.imageUrl.startsWith('blob:') ? image.imageUrl : ''

      return {
        imageUrl,
        originalImageUrl: typeof image.originalImageUrl === 'string' ? image.originalImageUrl : null,
        optimizedImageUrl: typeof image.optimizedImageUrl === 'string' ? image.optimizedImageUrl : null,
        thumbnailImageUrl: typeof image.thumbnailImageUrl === 'string' ? image.thumbnailImageUrl : null,
        sortOrder: index,
        width: typeof image.width === 'number' ? image.width : null,
        height: typeof image.height === 'number' ? image.height : null,
        fileSizeBytes: typeof image.fileSizeBytes === 'number' ? image.fileSizeBytes : null,
        contentType: typeof image.contentType === 'string' ? image.contentType : null,
        derivatives: image.derivatives ?? null,
        isVerified: Boolean(image.isVerified),
        processingStatus: typeof image.processingStatus === 'string' ? image.processingStatus : null,
        processingError: typeof image.processingError === 'string' ? image.processingError : null,
        cleanupStatus: typeof image.cleanupStatus === 'string' ? image.cleanupStatus : 'active',
        originalFilePath: typeof image.originalFilePath === 'string' ? image.originalFilePath : null,
        optimizedFilePath: typeof image.optimizedFilePath === 'string' ? image.optimizedFilePath : null,
        thumbnailFilePath: typeof image.thumbnailFilePath === 'string' ? image.thumbnailFilePath : null,
        status: imageUrl ? 'ready' as const : 'empty' as const,
        errorMessage: null,
        pendingFile: null,
      }
    })

  return normalized.length > 0 ? normalized : [createEmptyImageDraft(0)]
}

function createEmptyImageDraft(sortOrder: number): EpisodeImageDraft {
  return {
    imageUrl: '',
    originalImageUrl: null,
    optimizedImageUrl: null,
    thumbnailImageUrl: null,
    sortOrder,
    width: null,
    height: null,
    fileSizeBytes: null,
    contentType: null,
    derivatives: null,
    isVerified: false,
    processingStatus: null,
    processingError: null,
    cleanupStatus: 'active',
    originalFilePath: null,
    optimizedFilePath: null,
    thumbnailFilePath: null,
    status: 'empty',
    errorMessage: null,
    pendingFile: null,
  }
}

function getStatusLabel(status: ImageUploadStatus) {
  switch (status) {
    case 'pending':
      return '저장 대기'
    case 'uploading':
      return '업로드 중'
    case 'ready':
      return '준비 완료'
    case 'failed':
      return '실패'
    case 'empty':
    default:
      return '비어 있음'
  }
}

function getStatusClassName(status: ImageUploadStatus) {
  switch (status) {
    case 'pending':
      return 'border-sky-300/20 bg-sky-500/10 text-sky-100'
    case 'uploading':
      return 'border-amber-300/20 bg-amber-500/10 text-amber-100'
    case 'ready':
      return 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100'
    case 'failed':
      return 'border-rose-300/20 bg-rose-500/10 text-rose-100'
    case 'empty':
    default:
      return 'border-white/10 bg-black/20 text-zinc-500'
  }
}

function getImageMetaLine(image: EpisodeImageDraft) {
  const dimensions = image.width && image.height ? `${image.width}x${image.height}px` : null
  const size = image.fileSizeBytes ? formatFileSize(image.fileSizeBytes) : image.pendingFile ? formatFileSize(image.pendingFile.size) : null
  const type = image.contentType || image.pendingFile?.type || null
  const fallback = image.processingStatus === 'partial' ? '원본 표시 중' : null

  return [dimensions, size, type, fallback].filter(Boolean).join(' · ') || '이미지 정보가 저장 후 표시됩니다.'
}

function getDiagnosticClassName(level: DiagnosticLevel) {
  switch (level) {
    case 'error':
      return 'border-rose-300/20 bg-rose-500/10 text-rose-100'
    case 'warning':
      return 'border-amber-300/20 bg-amber-500/10 text-amber-100'
    case 'pass':
    default:
      return 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100'
  }
}

function getDiagnosticLabel(level: DiagnosticLevel) {
  switch (level) {
    case 'error':
      return '확인 필요'
    case 'warning':
      return '주의'
    case 'pass':
    default:
      return '통과'
  }
}

function getImageDiagnostics(image: EpisodeImageDraft): ImageDiagnosticItem[] {
  const items: ImageDiagnosticItem[] = []
  const hasImage = Boolean(image.imageUrl.trim())
  const fileSizeBytes = image.fileSizeBytes ?? image.pendingFile?.size ?? null
  const contentType = image.contentType || image.pendingFile?.type || null

  if (!hasImage) {
    items.push({
      level: 'error',
      title: '이미지 없음',
      message: '공개 회차에는 실제 이미지가 필요합니다.',
    })
    return items
  }

  if (image.status === 'failed') {
    items.push({
      level: 'error',
      title: '업로드 실패',
      message: image.errorMessage ?? '실패한 컷을 다시 업로드해 주세요.',
    })
  }

  if (image.status === 'pending' || image.status === 'uploading') {
    items.push({
      level: 'warning',
      title: '처리 대기',
      message: '저장 또는 업로드가 끝난 뒤 공개 상태로 전환하는 것이 안전합니다.',
    })
  }

  if (image.processingStatus === 'partial') {
    items.push({
      level: 'warning',
      title: '원본 fallback',
      message: '최적화본 생성에 실패해 원본으로 표시 중이며 자동 재처리 대상입니다.',
    })
  }

  if (image.processingStatus === 'retry_needed') {
    items.push({
      level: 'warning',
      title: '재처리 필요',
      message: '최적화 재시도가 필요합니다. 자동 작업이 다시 처리합니다.',
    })
  }

  if (image.processingStatus === 'failed') {
    items.push({
      level: 'error',
      title: '최적화 실패',
      message: image.processingError ?? '최적화 실패 상태입니다. 원본 파일을 교체해 주세요.',
    })
  }

  if (
    contentType &&
    !(IMAGE_UPLOAD_POLICY.allowedContentTypes as readonly string[]).includes(contentType)
  ) {
    items.push({
      level: 'error',
      title: '지원하지 않는 형식',
      message: 'JPG, PNG, WebP 형식만 안정적으로 지원합니다.',
    })
  }

  if (fileSizeBytes && fileSizeBytes > IMAGE_UPLOAD_POLICY.maxFileBytes) {
    items.push({
      level: 'error',
      title: '용량 초과',
      message: `파일당 최대 ${formatFileSize(IMAGE_UPLOAD_POLICY.maxFileBytes)}까지 업로드할 수 있습니다.`,
    })
  } else if (fileSizeBytes && fileSizeBytes > IMAGE_UPLOAD_POLICY.compressionWarningBytes) {
    items.push({
      level: 'warning',
      title: '큰 파일',
      message: '독자 로딩 속도를 위해 압축 또는 컷 분할을 권장합니다.',
    })
  }

  if (image.width && image.height) {
    if (image.width < IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMin) {
      items.push({
        level: 'warning',
        title: '가로폭 작음',
        message: `${IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMin}px 이상이면 확대 화면에서 더 선명합니다.`,
      })
    }

    if (image.width > IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMax) {
      items.push({
        level: 'warning',
        title: '가로폭 큼',
        message: `${IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMax}px 안팎으로 맞추면 로딩이 안정적입니다.`,
      })
    }

    if (
      image.height >= IMAGE_UPLOAD_POLICY.longStripHeightPx ||
      image.height / image.width >= IMAGE_UPLOAD_POLICY.longStripRatio
    ) {
      items.push({
        level: 'warning',
        title: '긴 세로 원고',
        message: '너무 긴 이미지는 일부 환경에서 로딩이 불안정할 수 있어 컷 분할을 권장합니다.',
      })
    }
  } else if (hasImage && image.isVerified) {
    items.push({
      level: 'warning',
      title: '크기 정보 없음',
      message: '이미지 크기 정보가 없어 선명도와 긴 원고 여부를 자동 판정하지 못했습니다.',
    })
  }

  if (hasImage && !image.isVerified && !image.pendingFile) {
    items.push({
      level: 'warning',
      title: '직접 입력 URL',
      message: '직접 입력한 URL은 서버 검증과 자동 최적화 정보가 제한됩니다.',
    })
  }

  if (items.length === 0) {
    items.push({
      level: 'pass',
      title: '품질 기준 통과',
      message: '크기, 형식, 처리 상태가 공개 기준에 맞습니다.',
    })
  }

  return items
}

function getHighestDiagnosticLevel(items: ImageDiagnosticItem[]): DiagnosticLevel {
  if (items.some((item) => item.level === 'error')) {
    return 'error'
  }

  if (items.some((item) => item.level === 'warning')) {
    return 'warning'
  }

  return 'pass'
}

export function EpisodeImagesField({
  channelId,
  episodeId,
  initialImages,
  draftStorageKey,
}: {
  channelId: string
  episodeId?: string
  initialImages: WebtoonEpisodeImageRecord[]
  draftStorageKey?: string
}) {
  const [images, setImages] = useState<EpisodeImageDraft[]>(() => normalizeImages(initialImages))
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [isBatchUploading, setIsBatchUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [inspectionMessages, setInspectionMessages] = useState<string[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const draftLoadedRef = useRef(false)
  const guideItems = getWebtoonUploadGuide()
  const activeImages = images.filter((image) => image.imageUrl.trim())
  const diagnosticsByIndex = images.map((image) => {
    if (image.imageUrl.trim() || activeImages.length === 0) {
      return getImageDiagnostics(image)
    }

    return [
      {
        level: 'warning' as const,
        title: '빈 이미지 칸',
        message: '저장 시 제외됩니다. 필요 없으면 제거해 주세요.',
      },
    ]
  })
  const blockingDiagnosticCount = diagnosticsByIndex.flat().filter((item) => item.level === 'error').length
  const warningDiagnosticCount = diagnosticsByIndex.flat().filter((item) => item.level === 'warning').length
  const publishChecks = [
    {
      label: '이미지 등록',
      passed: activeImages.length > 0,
      message: activeImages.length > 0 ? `${activeImages.length}장 준비됨` : '공개 전 최소 1장 필요',
    },
    {
      label: '업로드 완료',
      passed: images.every((image) => image.status !== 'pending' && image.status !== 'uploading'),
      message: images.some((image) => image.status === 'pending' || image.status === 'uploading')
        ? '저장 대기 또는 업로드 중인 컷 있음'
        : '대기 중인 컷 없음',
    },
    {
      label: '차단 오류',
      passed: blockingDiagnosticCount === 0,
      message:
        blockingDiagnosticCount === 0
          ? '공개를 막는 이미지 오류 없음'
          : `${blockingDiagnosticCount}개 항목 확인 필요`,
    },
    {
      label: '자동 최적화',
      passed: images.every((image) => !image.imageUrl || image.processingStatus !== 'partial'),
      message: images.some((image) => image.processingStatus === 'partial')
        ? '원본 fallback 컷은 자동 재처리 대상'
        : '최적화 상태 안정',
    },
  ]
  const readyForPublish = publishChecks.every((check) => check.passed)
  const imagesJson = useMemo(
    () =>
      JSON.stringify(
        images.map((image, index) => ({
          imageUrl: image.imageUrl,
          originalImageUrl: image.originalImageUrl,
          optimizedImageUrl: image.optimizedImageUrl,
          thumbnailImageUrl: image.thumbnailImageUrl,
          sortOrder: index,
          width: image.width,
          height: image.height,
          fileSizeBytes: image.fileSizeBytes,
          contentType: image.contentType,
          derivatives: image.derivatives,
          isVerified: image.isVerified,
          processingStatus: image.processingStatus,
          processingError: image.processingError,
          cleanupStatus: image.cleanupStatus,
          originalFilePath: image.originalFilePath,
          optimizedFilePath: image.optimizedFilePath,
          thumbnailFilePath: image.thumbnailFilePath,
        }))
      ),
    [images]
  )

  useEffect(() => {
    if (!draftStorageKey) {
      draftLoadedRef.current = true
      return
    }

    try {
      const rawDraft = window.localStorage.getItem(draftStorageKey)

      if (!rawDraft) {
        draftLoadedRef.current = true
        return
      }

      const parsed = JSON.parse(rawDraft)

      if (Array.isArray(parsed)) {
        window.setTimeout(() => {
          setImages(normalizeDraftImages(parsed))
          setDraftRestored(true)
        }, 0)
      }
    } catch {
      window.localStorage.removeItem(draftStorageKey)
    } finally {
      draftLoadedRef.current = true
    }
  }, [draftStorageKey])

  useEffect(() => {
    if (!draftStorageKey || !draftLoadedRef.current) {
      return
    }

    const serializableImages = images.map((image, index) => {
      const imageUrl = image.imageUrl.startsWith('blob:') ? '' : image.imageUrl

      return {
        imageUrl,
        originalImageUrl: image.originalImageUrl,
        optimizedImageUrl: image.optimizedImageUrl,
        thumbnailImageUrl: image.thumbnailImageUrl,
        sortOrder: index,
        width: image.width,
        height: image.height,
        fileSizeBytes: image.fileSizeBytes,
        contentType: image.contentType,
        derivatives: image.derivatives,
        isVerified: image.isVerified,
        processingStatus: image.processingStatus,
        processingError: image.processingError,
        cleanupStatus: image.cleanupStatus,
        originalFilePath: image.originalFilePath,
        optimizedFilePath: image.optimizedFilePath,
        thumbnailFilePath: image.thumbnailFilePath,
        status: imageUrl ? image.status : 'empty',
        pendingFile: null,
        errorMessage: null,
      }
    })

    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(serializableImages))
    } catch {
      // Local draft persistence is best-effort only.
    }
  }, [draftStorageKey, images])

  function updateImage(index: number, value: string) {
    setInspectionMessages([])
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index
          ? {
              ...image,
              imageUrl: value,
              originalImageUrl: null,
              optimizedImageUrl: null,
              thumbnailImageUrl: null,
              width: null,
              height: null,
              fileSizeBytes: null,
              contentType: null,
              derivatives: null,
              isVerified: false,
              processingStatus: value ? 'ready' : null,
              processingError: null,
              cleanupStatus: 'active',
              originalFilePath: null,
              optimizedFilePath: null,
              thumbnailFilePath: null,
              status: value ? 'ready' : 'empty',
              errorMessage: null,
              pendingFile: null,
            }
          : image
      )
    )
  }

  function addImageRow() {
    setImages((current) => [...current, createEmptyImageDraft(current.length)])
  }

  function normalizeSortOrder(nextImages: EpisodeImageDraft[]) {
    return nextImages.map((image, imageIndex) => ({
      ...image,
      sortOrder: imageIndex,
    }))
  }

  function moveImageRow(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return
    }

    setImages((current) => {
      if (fromIndex >= current.length || toIndex >= current.length) {
        return current
      }

      const next = current.slice()
      const [moved] = next.splice(fromIndex, 1)

      if (!moved) {
        return current
      }

      next.splice(toIndex, 0, moved)
      return normalizeSortOrder(next)
    })
  }

  function removeImageRow(index: number) {
    setInspectionMessages([])
    setImages((current) => {
      if (current.length === 1) {
        return [createEmptyImageDraft(0)]
      }

      return current
        .filter((_, imageIndex) => imageIndex !== index)
        .map((image, imageIndex) => ({
          ...image,
          sortOrder: imageIndex,
        }))
    })
  }

  async function prepareEpisodeFiles(files: File[]) {
    const result = await prepareAndInspectImageFiles(files, 'webtoon-panel')

    setInspectionMessages(result.messages)

    if (result.errors.length > 0) {
      setMessage(result.errors[0])
      return null
    }

    return result
  }

  async function uploadImageWithSignedUrl({
    index,
    file,
    width,
    height,
  }: {
    index: number
    file: File
    width: number | null
    height: number | null
  }): Promise<EpisodeUploadPayload> {
    const signedUrlResponse = await fetch('/api/upload/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelId,
        episodeId,
        sortOrder: index,
        contentType: file.type,
      }),
    })
    const signedUrlPayload = (await signedUrlResponse.json()) as {
      error?: string
      url?: string
      filePath?: string
      publicUrl?: string
      maxFileBytes?: number
    }

    if (!signedUrlResponse.ok || !signedUrlPayload.url || !signedUrlPayload.filePath || !signedUrlPayload.publicUrl) {
      throw new Error(signedUrlPayload.error || '직접 업로드 URL을 만들지 못했습니다.')
    }

    if (signedUrlPayload.maxFileBytes && file.size > signedUrlPayload.maxFileBytes) {
      throw new Error(`파일당 최대 ${formatFileSize(signedUrlPayload.maxFileBytes)}까지 업로드할 수 있습니다.`)
    }

    const directUploadResponse = await fetch(signedUrlPayload.url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'x-goog-content-length-range': `1,${signedUrlPayload.maxFileBytes ?? file.size}`,
      },
      body: file,
    })

    if (!directUploadResponse.ok) {
      throw new Error('직접 업로드에 실패했습니다.')
    }

    return {
      imageUrl: signedUrlPayload.publicUrl,
      originalImageUrl: signedUrlPayload.publicUrl,
      optimizedImageUrl: null,
      thumbnailImageUrl: null,
      width,
      height,
      fileSizeBytes: file.size,
      contentType: file.type,
      derivatives: {
        original: {
          url: signedUrlPayload.publicUrl,
          filePath: signedUrlPayload.filePath,
          width,
          height,
          fileSizeBytes: file.size,
          contentType: file.type as WebtoonEpisodeImageRecord['contentType'],
        },
        optimized: null,
        thumbnail: null,
      },
      processingStatus: 'retry_needed',
      processingError: null,
      cleanupStatus: 'active',
      originalFilePath: signedUrlPayload.filePath,
      optimizedFilePath: null,
      thumbnailFilePath: null,
      isVerified: true,
    }
  }

  async function uploadImageWithServerEndpoint(index: number, file: File): Promise<EpisodeUploadPayload> {
    const formData = new FormData()
    formData.set('channelId', channelId)
    formData.set('episodeId', episodeId ?? '')
    formData.set('sortOrder', String(index))
    formData.set('file', file)

    const uploadResponse = await fetch('/api/upload/webtoon-episode-image', {
      method: 'POST',
      body: formData,
    })

    const uploadPayload = (await uploadResponse.json()) as EpisodeUploadPayload & { error?: string }

    if (!uploadResponse.ok || !uploadPayload.imageUrl) {
      throw new Error(uploadPayload.error || '회차 이미지 업로드에 실패했습니다.')
    }

    return uploadPayload
  }

  async function uploadImageAtIndex(index: number, file: File, options: { skipInspection?: boolean } = {}) {
    if (!file || !episodeId) {
      return false
    }

    setMessage(null)

    const preparedResult = options.skipInspection ? null : await prepareEpisodeFiles([file])
    const uploadFile = options.skipInspection ? file : preparedResult?.files[0]
    const inspection = preparedResult?.inspections[0]

    if (!uploadFile) {
      return false
    }

    try {
      setUploadingIndex(index)
      setImages((current) =>
        current.map((image, imageIndex) =>
          imageIndex === index
            ? {
                ...image,
                status: 'uploading',
                errorMessage: null,
                pendingFile: uploadFile,
                fileSizeBytes: uploadFile.size,
                contentType: uploadFile.type,
                width: inspection?.width ?? image.width,
                height: inspection?.height ?? image.height,
              }
            : image
        )
      )

      let uploadPayload: EpisodeUploadPayload

      try {
        uploadPayload = await uploadImageWithSignedUrl({
          index,
          file: uploadFile,
          width: inspection?.width ?? images[index]?.width ?? null,
          height: inspection?.height ?? images[index]?.height ?? null,
        })
      } catch {
        uploadPayload = await uploadImageWithServerEndpoint(index, uploadFile)
      }

      setImages((current) =>
        current.map((image, imageIndex) =>
          imageIndex === index
            ? {
                ...image,
                imageUrl: uploadPayload.imageUrl ?? '',
                originalImageUrl: uploadPayload.originalImageUrl ?? null,
                optimizedImageUrl: uploadPayload.optimizedImageUrl ?? null,
                thumbnailImageUrl: uploadPayload.thumbnailImageUrl ?? null,
                width: uploadPayload.width ?? null,
                height: uploadPayload.height ?? null,
                fileSizeBytes: uploadPayload.fileSizeBytes ?? null,
                contentType: uploadPayload.contentType ?? null,
                derivatives: uploadPayload.derivatives ?? null,
                isVerified: uploadPayload.isVerified ?? true,
                processingStatus: uploadPayload.processingStatus ?? 'ready',
                processingError: uploadPayload.processingError ?? null,
                cleanupStatus: uploadPayload.cleanupStatus ?? 'active',
                originalFilePath: uploadPayload.originalFilePath ?? null,
                optimizedFilePath: uploadPayload.optimizedFilePath ?? null,
                thumbnailFilePath: uploadPayload.thumbnailFilePath ?? null,
                status: 'ready',
                errorMessage: null,
                pendingFile: null,
              }
            : image
        )
      )
      setMessage(`${index + 1}번째 이미지가 업로드되었습니다.`)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '업로드 중 문제가 발생했습니다.'
      setMessage(errorMessage)
      setImages((current) =>
        current.map((image, imageIndex) =>
          imageIndex === index
            ? {
                ...image,
                status: 'failed',
                errorMessage,
                pendingFile: uploadFile,
              }
            : image
        )
      )
      return false
    } finally {
      setUploadingIndex(null)
    }
  }

  async function retryImageUpload(index: number) {
    const file = images[index]?.pendingFile

    if (!file || !episodeId) {
      return
    }

    await uploadImageAtIndex(index, file, { skipInspection: true })
  }

  async function handleBatchFilesSelected(files: File[]) {
    if (files.length === 0) {
      return
    }

    const preparedResult = await prepareEpisodeFiles(files)
    const preparedFiles = preparedResult?.files

    if (!preparedFiles) {
      return
    }

    if (!episodeId) {
      setImages(
        preparedFiles.map((file, index) => {
          const inspection = preparedResult.inspections[index]

          return {
            imageUrl: URL.createObjectURL(file),
            originalImageUrl: null,
            optimizedImageUrl: null,
            thumbnailImageUrl: null,
            sortOrder: index,
            width: inspection?.width ?? null,
            height: inspection?.height ?? null,
            fileSizeBytes: file.size,
            contentType: file.type,
            derivatives: null,
            isVerified: false,
            processingStatus: 'pending',
            processingError: null,
            cleanupStatus: 'active',
            originalFilePath: null,
            optimizedFilePath: null,
            thumbnailFilePath: null,
            status: 'pending',
            errorMessage: null,
            pendingFile: file,
          }
        })
      )
      setMessage('선택한 회차 이미지를 먼저 미리보고 있습니다. 회차를 저장하면 업로드가 함께 진행됩니다.')
      return
    }

    const existingEmptyIndices = images.reduce<number[]>((acc, image, index) => {
      if (!image.imageUrl.trim()) {
        acc.push(index)
      }

      return acc
    }, [])
    const additionalRowCount = Math.max(0, preparedFiles.length - existingEmptyIndices.length)
    const targetIndices = [
      ...existingEmptyIndices.slice(0, preparedFiles.length),
      ...Array.from({ length: additionalRowCount }, (_, offset) => images.length + offset),
    ]

    if (additionalRowCount > 0) {
      setImages((current) => [
        ...current,
        ...Array.from({ length: additionalRowCount }, (_, offset) => ({
          ...createEmptyImageDraft(current.length + offset),
        })),
      ])
    }

    setIsBatchUploading(true)
    setMessage(null)

    try {
      let successCount = 0
      let failedCount = 0

      for (const [offset, file] of preparedFiles.entries()) {
        const targetIndex = targetIndices[offset]
        const didUpload = await uploadImageAtIndex(targetIndex, file, { skipInspection: true })

        if (didUpload) {
          successCount += 1
        } else {
          failedCount += 1
        }
      }

      setMessage(
        failedCount > 0
          ? `${successCount}장 업로드 완료 · ${failedCount}장 실패`
          : `${successCount}장의 회차 이미지가 순서대로 업로드되었습니다.`
      )
    } finally {
      setIsBatchUploading(false)
    }
  }

  function renderDiagnosticPill(level: DiagnosticLevel) {
    return (
      <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${getDiagnosticClassName(level)}`}>
        {getDiagnosticLabel(level)}
      </span>
    )
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="imagesJson" value={imagesJson} readOnly />

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
        {episodeId
          ? '이미지를 올리면 GCS 공개 URL이 자동으로 채워지고, 저장 시 episode_images 테이블에 정렬 순서와 함께 기록됩니다.'
          : '새 회차는 먼저 저장한 뒤 수정 화면에서 이미지를 올릴 수 있습니다. 이미 URL이 있다면 먼저 직접 입력할 수도 있습니다.'}
      </div>

      {draftRestored ? (
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-500/5 p-4 text-xs leading-5 text-emerald-100">
          이전 로컬 초안의 이미지 순서를 복구했습니다. 서버에 업로드되지 않았던 로컬 파일은 보안상 다시 선택해야 합니다.
        </div>
      ) : null}

      <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-zinc-500">
        {guideItems.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>

      <section className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">발행 전 품질 체크</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {readyForPublish
                ? '이미지 등록, 처리 상태, 공개 차단 오류가 모두 안정적입니다.'
                : '공개 전 확인이 필요한 항목이 남아 있습니다.'}
            </p>
          </div>
          <div
            className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold ${
              readyForPublish
                ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100'
                : blockingDiagnosticCount > 0
                  ? 'border-rose-300/20 bg-rose-500/10 text-rose-100'
                  : 'border-amber-300/20 bg-amber-500/10 text-amber-100'
            }`}
          >
            {readyForPublish
              ? '공개 준비 완료'
              : blockingDiagnosticCount > 0
                ? '확인 필요'
                : '주의 항목 있음'}
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {publishChecks.map((check) => (
            <div
              key={check.label}
              className={`rounded-2xl border p-3 ${
                check.passed
                  ? 'border-emerald-300/10 bg-emerald-500/5'
                  : 'border-amber-300/10 bg-amber-500/5'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-zinc-200">{check.label}</p>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    check.passed ? 'bg-emerald-500/10 text-emerald-100' : 'bg-amber-500/10 text-amber-100'
                  }`}
                >
                  {check.passed ? '통과' : '점검'}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{check.message}</p>
            </div>
          ))}
        </div>

        {warningDiagnosticCount > 0 ? (
          <p className="mt-3 text-xs leading-5 text-amber-100">
            주의 항목 {warningDiagnosticCount}개가 있습니다. 공개는 가능할 수 있지만 로딩, 선명도, 자동 최적화 상태를 확인해 주세요.
          </p>
        ) : null}
      </section>

      <ImageUploadDropzone
        title="회차 이미지 여러 장 올리기"
        description={
          episodeId
            ? '여러 컷을 한 번에 선택하면 현재 순서대로 업로드 칸이 채워집니다.'
            : '새 회차 단계에서도 여러 이미지를 먼저 골라 순서를 확인할 수 있습니다. 저장 시 실제 업로드가 이어집니다.'
        }
        disabled={false}
        multiple
        isUploading={isBatchUploading || uploadingIndex !== null}
        buttonLabel="이미지 여러 장 고르기"
        inputName={episodeId ? undefined : 'pendingEpisodeImageFiles'}
        preserveSelection={!episodeId}
        selectedFiles={!episodeId ? images.flatMap((image) => (image.pendingFile ? [image.pendingFile] : [])) : undefined}
        onFilesSelected={handleBatchFilesSelected}
      />

      {inspectionMessages.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-zinc-400">
          {inspectionMessages.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4">
        {images.map((image, index) => {
          const diagnostics = diagnosticsByIndex[index] ?? []
          const highestDiagnosticLevel = getHighestDiagnosticLevel(diagnostics)

          return (
            <section
              key={`episode-image-${index}`}
              draggable={images.length > 1}
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(event) => {
                if (draggedIndex !== null) {
                  event.preventDefault()
                }
              }}
              onDrop={(event) => {
                event.preventDefault()

                if (draggedIndex !== null) {
                  moveImageRow(draggedIndex, index)
                  setDraggedIndex(null)
                }
              }}
              onDragEnd={() => setDraggedIndex(null)}
              className={`rounded-3xl border bg-white/5 p-4 transition ${
                draggedIndex === index ? 'border-emerald-300/40 opacity-70' : 'border-white/10'
              }`}
            >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">이미지 {index + 1}</p>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusClassName(image.status)}`}>
                      {getStatusLabel(image.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getDiagnosticClassName(highestDiagnosticLevel)}`}>
                      {getDiagnosticLabel(highestDiagnosticLevel)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    정렬 순서 {index + 1}번으로 저장됩니다. {getImageMetaLine(image)}
                  </p>
                  {image.errorMessage ? (
                    <p className="mt-2 text-xs leading-5 text-rose-200">{image.errorMessage}</p>
                  ) : null}
                  {image.processingStatus === 'partial' ? (
                    <p className="mt-2 text-xs leading-5 text-amber-100">
                      최적화본 생성에 실패해 원본 이미지로 보관 중입니다. 저장은 가능하며, 이후 재처리 대상입니다.
                      {image.processingError ? ` (${image.processingError})` : ''}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveImageRow(index, Math.max(0, index - 1))}
                    disabled={index === 0 || images.length < 2}
                    className="inline-flex rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    위로
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImageRow(index, Math.min(images.length - 1, index + 1))}
                    disabled={index === images.length - 1 || images.length < 2}
                    className="inline-flex rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    아래로
                  </button>
                  <FilePickerButton
                    label="이 이미지 고르기"
                    disabled={!episodeId || uploadingIndex !== null}
                    isUploading={uploadingIndex === index}
                    onFilesSelected={async (files) => {
                      const [file] = files

                      if (!file) {
                        return
                      }

                      await uploadImageAtIndex(index, file)
                    }}
                  />
                  {image.status === 'failed' && image.pendingFile && episodeId ? (
                    <button
                      type="button"
                      onClick={() => void retryImageUpload(index)}
                      disabled={uploadingIndex !== null}
                      className="inline-flex rounded-full border border-amber-300/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      재시도
                    </button>
                  ) : null}
                  {images.length > 1 || image.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => removeImageRow(index)}
                      className="inline-flex rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
                    >
                      제거
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                {diagnostics.map((item) => (
                  <div key={`${item.title}-${item.message}`} className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{item.message}</p>
                    </div>
                    <div className="mt-1 w-fit shrink-0">{renderDiagnosticPill(item.level)}</div>
                  </div>
                ))}
              </div>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-400">
                  {image.imageUrl
                    ? '파일 업로드 또는 직접 입력된 이미지가 준비되어 있습니다. 카드를 끌어서 순서를 바꿀 수 있습니다.'
                    : '파일 업로드를 기본으로 사용하고, 필요할 때만 URL 직접 입력을 열어주세요.'}
                </span>
              </label>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                {image.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.imageUrl} alt={`${index + 1}번째 회차 이미지`} className="h-auto w-full" />
                ) : (
                  <div className="flex h-56 items-center justify-center px-6 text-center text-sm leading-6 text-zinc-500">
                    아직 등록된 회차 이미지가 없습니다.
                  </div>
                )}
              </div>

              <details className="rounded-2xl border border-white/10 bg-black/20">
                <summary className="cursor-pointer px-4 py-3 text-sm text-zinc-300">
                  고급 옵션: {index + 1}번 이미지 주소 직접 입력
                </summary>
                <div className="border-t border-white/10 px-4 py-4">
                  <label className="grid gap-2 text-sm text-zinc-300">
                    <span>이미지 URL</span>
                    <input
                      value={image.imageUrl}
                      onChange={(event) => updateImage(index, event.target.value)}
                      className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                      placeholder="https://..."
                    />
                  </label>
                </div>
              </details>
            </div>
            </section>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addImageRow}
        className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
      >
        이미지 칸 추가
      </button>

      {message ? <p className="text-sm leading-6 text-zinc-400">{message}</p> : null}

      <details className="rounded-3xl border border-white/10 bg-black/20">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-zinc-200">
          독자 화면 미리보기
        </summary>
        <div className="border-t border-white/10 px-4 py-5">
          {images.some((image) => image.imageUrl) ? (
            <div className="mx-auto grid max-w-3xl gap-4">
              {images
                .filter((image) => image.imageUrl)
                .map((image, index) => (
                  <div key={`reader-preview-${image.imageUrl}-${index}`} className="overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.imageUrl} alt={`독자 미리보기 이미지 ${index + 1}`} className="h-auto w-full" />
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex min-h-40 items-center justify-center text-center text-sm leading-6 text-zinc-500">
              이미지가 준비되면 독자에게 보이는 세로 스크롤 화면을 여기서 확인할 수 있습니다.
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
