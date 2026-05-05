'use client'

import { useState } from 'react'
import { ImageUploadDropzone } from '@/components/upload/ImageUploadDropzone'

export function SparkCoverField({
  channelId,
  initialValue,
}: {
  channelId?: string
  initialValue?: string | null
}) {
  const [value, setValue] = useState(initialValue ?? '')
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const previewUrl = localPreviewUrl || value

  async function uploadFile(file: File) {
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
    }
  }

  async function handleFilesSelected(files: File[]) {
    const [file] = files

    if (!file) {
      return
    }

    if (!channelId) {
      setLocalPreviewUrl(URL.createObjectURL(file))
      setMessage('선택한 커버 이미지를 먼저 미리보고 있습니다. 스파크를 저장하면 업로드가 함께 진행됩니다.')
      return
    }

    await uploadFile(file)
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="coverImageUrl" value={value} readOnly />

      <ImageUploadDropzone
        title="커버 이미지 올리기"
        description={
          channelId
            ? '파일을 올리면 공개 URL이 자동으로 입력됩니다. 저장 버튼까지 눌러야 최종 반영됩니다.'
            : '새 스파크 단계에서도 먼저 커버를 골라 미리볼 수 있습니다. 저장 시 실제 업로드가 이어집니다.'
        }
        disabled={false}
        isUploading={isUploading}
        buttonLabel="커버 이미지 고르기"
        inputName={channelId ? undefined : 'coverImageFile'}
        preserveSelection={!channelId}
        onFilesSelected={handleFilesSelected}
      />

      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
        {previewUrl
          ? '업로드된 커버 이미지가 저장 대기 상태입니다. 아래 미리보기에서 바로 확인할 수 있습니다.'
          : '파일 업로드가 기본 방식입니다. 외부 이미지 주소가 필요할 때만 아래 고급 옵션을 사용하면 됩니다.'}
      </div>

      <details className="rounded-2xl border border-white/10 bg-black/20">
        <summary className="cursor-pointer px-4 py-3 text-sm text-zinc-300">
          고급 옵션: 이미지 주소 직접 입력
        </summary>
        <div className="border-t border-white/10 px-4 py-4">
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>커버 이미지 URL</span>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
              placeholder="https://..."
            />
          </label>
        </div>
      </details>

      {message ? <p className="text-sm leading-6 text-zinc-400">{message}</p> : null}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Spark cover preview" className="h-56 w-full object-cover" />
        ) : (
          <div className="flex h-56 items-center justify-center px-6 text-center text-sm leading-6 text-zinc-500">
            업로드되거나 입력된 커버 이미지가 이곳에 미리보기로 표시됩니다.
          </div>
        )}
      </div>
    </div>
  )
}
