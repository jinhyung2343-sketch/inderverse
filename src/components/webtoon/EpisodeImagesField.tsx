'use client'

import { useMemo, useState } from 'react'
import { FilePickerButton, ImageUploadDropzone } from '@/components/upload/ImageUploadDropzone'
import {
  formatFileSize,
  getWebtoonUploadGuide,
  prepareAndInspectImageFiles,
} from '@/lib/image-upload-policy'
import type { WebtoonEpisodeImageRecord } from '@/lib/webtoon'

type ImageUploadStatus = 'empty' | 'pending' | 'uploading' | 'ready' | 'failed'

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

export function EpisodeImagesField({
  channelId,
  episodeId,
  initialImages,
}: {
  channelId: string
  episodeId?: string
  initialImages: WebtoonEpisodeImageRecord[]
}) {
  const [images, setImages] = useState<EpisodeImageDraft[]>(() => normalizeImages(initialImages))
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [isBatchUploading, setIsBatchUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [inspectionMessages, setInspectionMessages] = useState<string[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const guideItems = getWebtoonUploadGuide()
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

    return result.files
  }

  async function uploadImageAtIndex(index: number, file: File, options: { skipInspection?: boolean } = {}) {
    if (!file || !episodeId) {
      return false
    }

    setMessage(null)

    const uploadFile = options.skipInspection ? file : (await prepareEpisodeFiles([file]))?.[0]

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
              }
            : image
        )
      )

      const formData = new FormData()
      formData.set('channelId', channelId)
      formData.set('episodeId', episodeId)
      formData.set('sortOrder', String(index))
      formData.set('file', uploadFile)

      const uploadResponse = await fetch('/api/upload/webtoon-episode-image', {
        method: 'POST',
        body: formData,
      })

      const uploadPayload = (await uploadResponse.json()) as {
        error?: string
        imageUrl?: string
        originalImageUrl?: string
        optimizedImageUrl?: string
        thumbnailImageUrl?: string
        width?: number | null
        height?: number | null
        fileSizeBytes?: number
        contentType?: string
        derivatives?: WebtoonEpisodeImageRecord['derivatives']
        processingStatus?: string
        processingError?: string | null
        cleanupStatus?: string
        originalFilePath?: string | null
        optimizedFilePath?: string | null
        thumbnailFilePath?: string | null
      }

      if (!uploadResponse.ok || !uploadPayload.imageUrl) {
        throw new Error(uploadPayload.error || '회차 이미지 업로드에 실패했습니다.')
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
                isVerified: true,
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

    const preparedFiles = await prepareEpisodeFiles(files)

    if (!preparedFiles) {
      return
    }

    if (!episodeId) {
      setImages(
        preparedFiles.map((file, index) => ({
          imageUrl: URL.createObjectURL(file),
          originalImageUrl: null,
          optimizedImageUrl: null,
          thumbnailImageUrl: null,
          sortOrder: index,
          width: null,
          height: null,
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
        }))
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

  return (
    <div className="grid gap-4">
      <input type="hidden" name="imagesJson" value={imagesJson} readOnly />

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
        {episodeId
          ? '이미지를 올리면 GCS 공개 URL이 자동으로 채워지고, 저장 시 episode_images 테이블에 정렬 순서와 함께 기록됩니다.'
          : '새 회차는 먼저 저장한 뒤 수정 화면에서 이미지를 올릴 수 있습니다. 이미 URL이 있다면 먼저 직접 입력할 수도 있습니다.'}
      </div>

      <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-zinc-500">
        {guideItems.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>

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
        {images.map((image, index) => (
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
        ))}
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
