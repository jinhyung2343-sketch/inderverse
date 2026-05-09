'use client'

import { useState } from 'react'
import { ImageUploadDropzone } from '@/components/upload/ImageUploadDropzone'

export function CreatorChannelImageField({
  creatorChannelId,
  imageRole,
  inputName,
  initialValue,
  label,
  description,
  previewClassName,
}: {
  creatorChannelId: string
  imageRole: 'avatar' | 'cover'
  inputName: 'avatarUrl' | 'coverImageUrl'
  initialValue?: string | null
  label: string
  description: string
  previewClassName: string
}) {
  const [value, setValue] = useState(initialValue ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function uploadFile(file: File) {
    setMessage(null)
    setIsUploading(true)

    try {
      const signedUrlResponse = await fetch('/api/upload/creator-channel-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorChannelId,
          imageRole,
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
      setMessage('이미지가 업로드되어 저장 대기 상태로 반영되었습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '업로드 중 문제가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleFilesSelected(files: File[]) {
    const [file] = files

    if (!file) {
      return
    }

    await uploadFile(file)
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name={inputName} value={value} readOnly />

      <ImageUploadDropzone
        title={label}
        description={description}
        isUploading={isUploading}
        buttonLabel="이미지 고르기"
        onFilesSelected={handleFilesSelected}
      />

      {message ? <p className="text-sm leading-6 text-zinc-400">{message}</p> : null}

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={`${label} preview`} className={previewClassName} />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-zinc-500">
            아직 이미지가 없습니다.
          </div>
        )}
      </div>

      <details className="rounded-2xl border border-white/10 bg-black/20">
        <summary className="cursor-pointer px-4 py-3 text-sm text-zinc-300">
          고급 옵션: 이미지 주소 직접 입력
        </summary>
        <div className="border-t border-white/10 px-4 py-4">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
            placeholder="https://..."
          />
        </div>
      </details>
    </div>
  )
}
