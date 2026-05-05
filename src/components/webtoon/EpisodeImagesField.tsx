'use client'

import { useMemo, useState } from 'react'
import { FilePickerButton, ImageUploadDropzone } from '@/components/upload/ImageUploadDropzone'
import type { WebtoonEpisodeImageRecord } from '@/lib/webtoon'

function normalizeImages(initialImages: WebtoonEpisodeImageRecord[]) {
  if (initialImages.length === 0) {
    return [{ imageUrl: '', sortOrder: 0 }]
  }

  return initialImages
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image, index) => ({
      imageUrl: image.imageUrl,
      sortOrder: index,
    }))
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
  const [images, setImages] = useState(() => normalizeImages(initialImages))
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [isBatchUploading, setIsBatchUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const imagesJson = useMemo(
    () =>
      JSON.stringify(
        images.map((image, index) => ({
          imageUrl: image.imageUrl,
          sortOrder: index,
        }))
      ),
    [images]
  )

  function updateImage(index: number, value: string) {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index
          ? {
              ...image,
              imageUrl: value,
            }
          : image
      )
    )
  }

  function addImageRow() {
    setImages((current) => [...current, { imageUrl: '', sortOrder: current.length }])
  }

  function removeImageRow(index: number) {
    setImages((current) =>
      current
        .filter((_, imageIndex) => imageIndex !== index)
        .map((image, imageIndex) => ({
          ...image,
          sortOrder: imageIndex,
        }))
    )
  }

  async function uploadImageAtIndex(index: number, file: File) {
    if (!file || !episodeId) {
      return
    }

    setMessage(null)
    setUploadingIndex(index)

    try {
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
        publicUrl?: string
      }

      if (!signedUrlResponse.ok || !signedUrlPayload.url || !signedUrlPayload.publicUrl) {
        throw new Error(signedUrlPayload.error || '업로드용 주소를 만들지 못했습니다.')
      }

      const uploadResponse = await fetch(signedUrlPayload.url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('회차 이미지 업로드에 실패했습니다.')
      }

      updateImage(index, signedUrlPayload.publicUrl)
      setMessage(`${index + 1}번째 이미지가 업로드되었습니다.`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '업로드 중 문제가 발생했습니다.'
      setMessage(errorMessage)
    } finally {
      setUploadingIndex(null)
    }
  }

  async function handleBatchFilesSelected(files: File[]) {
    if (files.length === 0) {
      return
    }

    if (!episodeId) {
      setImages(
        files.map((file, index) => ({
          imageUrl: URL.createObjectURL(file),
          sortOrder: index,
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
    const additionalRowCount = Math.max(0, files.length - existingEmptyIndices.length)
    const targetIndices = [
      ...existingEmptyIndices.slice(0, files.length),
      ...Array.from({ length: additionalRowCount }, (_, offset) => images.length + offset),
    ]

    if (additionalRowCount > 0) {
      setImages((current) => [
        ...current,
        ...Array.from({ length: additionalRowCount }, (_, offset) => ({
          imageUrl: '',
          sortOrder: current.length + offset,
        })),
      ])
    }

    setIsBatchUploading(true)
    setMessage(null)

    try {
      for (const [offset, file] of files.entries()) {
        const targetIndex = targetIndices[offset]
        await uploadImageAtIndex(targetIndex, file)
      }

      setMessage(`${files.length}장의 회차 이미지가 순서대로 업로드되었습니다.`)
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
        onFilesSelected={handleBatchFilesSelected}
      />

      <div className="grid gap-4">
        {images.map((image, index) => (
          <section key={`episode-image-${index}`} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">이미지 {index + 1}</p>
                  <p className="text-xs text-zinc-500">정렬 순서 {index + 1}번으로 저장됩니다.</p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                  {images.length > 1 ? (
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
                    ? '파일 업로드 또는 직접 입력된 이미지가 준비되어 있습니다.'
                    : '파일 업로드를 기본으로 사용하고, 필요할 때만 URL 직접 입력을 열어주세요.'}
                </span>
              </label>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                {image.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.imageUrl} alt={`${index + 1}번째 회차 이미지`} className="h-auto w-full object-cover" />
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
    </div>
  )
}
