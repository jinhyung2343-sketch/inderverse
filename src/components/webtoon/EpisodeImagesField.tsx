'use client'

import { useMemo, useState } from 'react'
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

  async function handleFileChange(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

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
      event.target.value = ''
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
                  <label
                    className={`inline-flex w-fit rounded-full px-4 py-2 text-sm transition ${
                      episodeId
                        ? 'cursor-pointer border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                        : 'cursor-not-allowed border border-white/10 bg-black/30 text-zinc-600'
                    }`}
                  >
                    {uploadingIndex === index ? '업로드 중...' : '이미지 업로드'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => void handleFileChange(index, event)}
                      disabled={!episodeId || uploadingIndex !== null}
                      className="hidden"
                    />
                  </label>
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
                <span>이미지 URL</span>
                <input
                  value={image.imageUrl}
                  onChange={(event) => updateImage(index, event.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="https://..."
                />
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

