'use client'

import { useState } from 'react'

export function SparkCoverField({
  channelId,
  initialValue,
}: {
  channelId?: string
  initialValue?: string | null
}) {
  const [value, setValue] = useState(initialValue ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file || !channelId) {
      return
    }

    setMessage(null)
    setIsUploading(true)

    try {
      const signedUrlResponse = await fetch('/api/upload/spark-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
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
        throw new Error('이미지 업로드에 실패했습니다.')
      }

      setValue(signedUrlPayload.publicUrl)
      setMessage('커버 이미지가 업로드되어 저장 대기 상태로 반영되었습니다.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '업로드 중 문제가 발생했습니다.'
      setMessage(errorMessage)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm text-zinc-300">
        <span>커버 이미지 URL</span>
        <input
          name="coverImageUrl"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
          placeholder="https://..."
        />
      </label>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white">GCS 커버 업로드</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {channelId
                ? '파일을 올리면 공개 URL이 자동으로 입력됩니다. 저장 버튼까지 눌러야 최종 반영됩니다.'
                : '새 스파크를 먼저 저장하면 여기에서 바로 커버 이미지를 올릴 수 있습니다.'}
            </p>
          </div>
          <label
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm transition ${
              channelId
                ? 'cursor-pointer border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                : 'cursor-not-allowed border border-white/10 bg-black/30 text-zinc-600'
            }`}
          >
            {isUploading ? '업로드 중...' : '이미지 선택'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => void handleFileChange(event)}
              disabled={!channelId || isUploading}
              className="hidden"
            />
          </label>
        </div>

        {message ? <p className="mt-3 text-sm leading-6 text-zinc-400">{message}</p> : null}
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Spark cover preview" className="h-56 w-full object-cover" />
        ) : (
          <div className="flex h-56 items-center justify-center px-6 text-center text-sm leading-6 text-zinc-500">
            업로드되거나 입력된 커버 이미지가 이곳에 미리보기로 표시됩니다.
          </div>
        )}
      </div>
    </div>
  )
}
