export const IMAGE_UPLOAD_POLICY = {
  allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileBytes: 20 * 1024 * 1024,
  compressionWarningBytes: 10 * 1024 * 1024,
  recommendedWebtoonWidthMin: 1080,
  recommendedWebtoonWidthMax: 1600,
  longStripHeightPx: 20000,
  longStripRatio: 8,
  largeBatchWarningBytes: 100 * 1024 * 1024,
} as const

const allowedContentTypes = IMAGE_UPLOAD_POLICY.allowedContentTypes as readonly string[]

type ImageUploadPurpose = 'cover' | 'webtoon-panel'

export interface ImageFileInspection {
  fileName: string
  fileSizeLabel: string
  width: number | null
  height: number | null
  errors: string[]
  warnings: string[]
}

interface PreparedImageFile {
  file: File
  messages: string[]
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function getWebtoonUploadGuide() {
  return [
    `지원 형식: JPG, PNG, WebP`,
    `파일당 최대 ${formatFileSize(IMAGE_UPLOAD_POLICY.maxFileBytes)}`,
    `권장 가로폭: ${IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMin}px-${IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMax}px`,
    `긴 세로 원고는 컷 단위로 나누면 독자 로딩이 안정적입니다.`,
  ]
}

function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('이미지 크기를 읽지 못했습니다. 파일이 손상되었는지 확인해 주세요.'))
    }

    image.src = objectUrl
  })
}

function replaceFileExtension(fileName: string, extension: string) {
  return fileName.includes('.') ? fileName.replace(/\.[^.]+$/, `.${extension}`) : `${fileName}.${extension}`
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

async function compressImageFile(
  file: File,
  width: number,
  height: number,
  targetWidth: number,
  purpose: ImageUploadPurpose
) {
  const targetHeight = Math.max(1, Math.round((height * targetWidth) / width))
  const image = new Image()
  const objectUrl = URL.createObjectURL(file)

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('이미지 압축 준비에 실패했습니다.'))
      image.src = objectUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const context = canvas.getContext('2d')

    if (!context) {
      return null
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight)

    const blob = await canvasToBlob(canvas, 'image/webp', purpose === 'cover' ? 0.88 : 0.9)

    if (!blob || blob.size >= file.size) {
      return null
    }

    return new File([blob], replaceFileExtension(file.name, 'webp'), {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function prepareImageFileForUpload(file: File, purpose: ImageUploadPurpose): Promise<PreparedImageFile> {
  if (!allowedContentTypes.includes(file.type)) {
    return { file, messages: [] }
  }

  const messages: string[] = []
  let dimensions: { width: number; height: number }

  try {
    dimensions = await readImageDimensions(file)
  } catch {
    return { file, messages: [] }
  }

  const { width, height } = dimensions
  const isLongWebtoonStrip =
    purpose === 'webtoon-panel' &&
    (height >= IMAGE_UPLOAD_POLICY.longStripHeightPx || height / width >= IMAGE_UPLOAD_POLICY.longStripRatio)
  const shouldResize =
    width > IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMax &&
    (purpose === 'cover' || !isLongWebtoonStrip)
  const shouldCompress = file.size > IMAGE_UPLOAD_POLICY.compressionWarningBytes

  if (!shouldResize && !shouldCompress) {
    return { file, messages }
  }

  if (isLongWebtoonStrip) {
    messages.push(`${file.name}: 긴 세로 원고는 자동 압축보다 컷 단위 분할을 권장합니다.`)
    return { file, messages }
  }

  const targetWidth = shouldResize ? IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMax : width
  const compressedFile = await compressImageFile(file, width, height, targetWidth, purpose)

  if (!compressedFile) {
    messages.push(`${file.name}: 자동 최적화를 시도했지만 원본이 더 적합해 원본을 유지했습니다.`)
    return { file, messages }
  }

  messages.push(
    `${file.name}: 자동 최적화 완료 ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`
  )

  return { file: compressedFile, messages }
}

export async function prepareAndInspectImageFiles(files: File[], purpose: ImageUploadPurpose) {
  const prepared = await Promise.all(files.map((file) => prepareImageFileForUpload(file, purpose)))
  const preparedFiles = prepared.map((entry) => entry.file)
  const totalBytes = preparedFiles.reduce((total, file) => total + file.size, 0)
  const inspections = await inspectImageFiles(preparedFiles, purpose)

  return {
    files: preparedFiles,
    errors: getBlockingImageErrors(inspections),
    messages: [
      ...prepared.flatMap((entry) => entry.messages),
      ...getImageInspectionMessages(inspections, totalBytes),
    ],
  }
}

export async function inspectImageFile(
  file: File,
  purpose: ImageUploadPurpose
): Promise<ImageFileInspection> {
  const errors: string[] = []
  const warnings: string[] = []
  let width: number | null = null
  let height: number | null = null

  if (!allowedContentTypes.includes(file.type)) {
    errors.push('JPG, PNG, WebP 이미지만 업로드할 수 있습니다.')
  }

  if (file.size > IMAGE_UPLOAD_POLICY.maxFileBytes) {
    errors.push(`파일 용량이 ${formatFileSize(IMAGE_UPLOAD_POLICY.maxFileBytes)}를 넘습니다.`)
  } else if (file.size > IMAGE_UPLOAD_POLICY.compressionWarningBytes) {
    warnings.push('용량이 큰 편입니다. 가능하면 WebP 또는 고품질 JPG로 압축해 주세요.')
  }

  if (file.type === 'image/png' && file.size > 8 * 1024 * 1024) {
    warnings.push('투명 배경이 필요 없다면 PNG보다 JPG 또는 WebP가 독자 로딩에 유리합니다.')
  }

  if (errors.length === 0) {
    try {
      const dimensions = await readImageDimensions(file)
      width = dimensions.width
      height = dimensions.height
    } catch (error) {
      errors.push(error instanceof Error ? error.message : '이미지 크기를 읽지 못했습니다.')
    }
  }

  if (width && height) {
    if (purpose === 'webtoon-panel') {
      if (width < IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMin) {
        warnings.push(
          `가로폭이 ${width}px입니다. 독자 화면 확대 시 흐릴 수 있어 ${IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMin}px 이상을 권장합니다.`
        )
      }

      if (width > IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMax) {
        warnings.push(
          `가로폭이 ${width}px입니다. 독자 로딩 속도를 위해 ${IMAGE_UPLOAD_POLICY.recommendedWebtoonWidthMax}px 안팎을 권장합니다.`
        )
      }

      if (
        height >= IMAGE_UPLOAD_POLICY.longStripHeightPx ||
        height / width >= IMAGE_UPLOAD_POLICY.longStripRatio
      ) {
        warnings.push('세로로 긴 원고입니다. 안정적인 로딩을 위해 여러 컷으로 나누는 것을 권장합니다.')
      }
    }

    if (purpose === 'cover' && width < 720) {
      warnings.push('표지 가로폭이 작습니다. 목록과 상세 화면에서 선명하게 보이려면 720px 이상을 권장합니다.')
    }
  }

  return {
    fileName: file.name,
    fileSizeLabel: formatFileSize(file.size),
    width,
    height,
    errors,
    warnings,
  }
}

export async function inspectImageFiles(files: File[], purpose: ImageUploadPurpose) {
  return Promise.all(files.map((file) => inspectImageFile(file, purpose)))
}

export function getImageInspectionMessages(inspections: ImageFileInspection[], totalBytes: number) {
  const messages = [
    `${inspections.length}장 선택 · 총 ${formatFileSize(totalBytes)}`,
    ...inspections.map((inspection) => {
      const size = inspection.width && inspection.height ? `${inspection.width}x${inspection.height}px` : '크기 확인 전'
      return `${inspection.fileName}: ${size} · ${inspection.fileSizeLabel}`
    }),
    ...inspections.flatMap((inspection) => inspection.warnings.map((warning) => `${inspection.fileName}: ${warning}`)),
  ]

  if (totalBytes > IMAGE_UPLOAD_POLICY.largeBatchWarningBytes) {
    messages.push('전체 용량이 큽니다. 회차를 나누거나 원고를 압축하면 독자 로딩이 안정적입니다.')
  }

  return messages
}

export function getBlockingImageErrors(inspections: ImageFileInspection[]) {
  return inspections.flatMap((inspection) => inspection.errors.map((error) => `${inspection.fileName}: ${error}`))
}
