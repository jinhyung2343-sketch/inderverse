'use client'

import { useEffect, useRef, useState } from 'react'
import { ImageUploadDropzone } from '@/components/upload/ImageUploadDropzone'
import {
  formatFileSize,
  getWebtoonUploadGuide,
  prepareAndInspectImageFiles,
} from '@/lib/image-upload-policy'
import { uploadToSupabaseSignedUrl } from '@/lib/storage/client-upload'

type CoverUploadPhase = 'idle' | 'compressing' | 'uploading' | 'ready'
type CoverImageIntent = 'keep' | 'set' | 'clear'

function getCoverUploadPhaseLabel(phase: CoverUploadPhase) {
  if (phase === 'compressing') {
    return '이미지 최적화 중'
  }

  if (phase === 'uploading') {
    return '스토리지 업로드 중'
  }

  if (phase === 'ready') {
    return '최적화 완료'
  }

  return ''
}

export function WebtoonCoverField({
  channelId,
  initialValue,
  onUploadStateChange,
  workLabel = '웹툰',
}: {
  channelId?: string
  initialValue?: string | null
  onUploadStateChange?: (isUploading: boolean) => void
  workLabel?: string
}) {
  const [value, setValue] = useState(initialValue ?? '')
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const localPreviewUrlRef = useRef<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [inspectionMessages, setInspectionMessages] = useState<string[]>([])
  const [coverImageIntent, setCoverImageIntent] = useState<CoverImageIntent>('keep')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadPhase, setUploadPhase] = useState<CoverUploadPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const previewUrl = localPreviewUrl || value
  const guideItems = getWebtoonUploadGuide('cover')
  const uploadPhaseLabel = getCoverUploadPhaseLabel(uploadPhase)

  useEffect(() => {
    return () => {
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    onUploadStateChange?.(isUploading)
  }, [isUploading, onUploadStateChange])

  function replaceLocalPreviewUrl(nextUrl: string | null) {
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current)
    }

    localPreviewUrlRef.current = nextUrl
    setLocalPreviewUrl(nextUrl)
  }

  async function prepareCoverFile(file: File) {
    setMessage('커버 이미지를 WebP로 최적화하고 있습니다.')
    setUploadPhase('compressing')
    setUploadProgress(15)

    const result = await prepareAndInspectImageFiles([file], 'cover')

    setInspectionMessages(result.messages)
    setUploadProgress(100)

    if (result.errors.length > 0) {
      setMessage(result.errors[0])
      setUploadPhase('idle')
      setUploadProgress(0)
      return null
    }

    return result.files[0] ?? null
  }

  async function uploadFile(file: File) {
    if (!file) {
      return
    }

    setMessage('최적화된 커버 이미지를 스토리지에 업로드하고 있습니다.')
    setUploadPhase('uploading')
    setUploadProgress(10)

    const signedUrlResponse = await fetch(
      channelId ? '/api/upload/channel-cover' : '/api/upload/channel-cover-draft',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(channelId ? { channelId } : {}),
          contentType: file.type,
        }),
      }
    )

    const signedUrlPayload = (await signedUrlResponse.json()) as {
      bucket?: string
      error?: string
      filePath?: string
      publicUrl?: string
      token?: string
    }

    if (
      !signedUrlResponse.ok ||
      !signedUrlPayload.bucket ||
      !signedUrlPayload.filePath ||
      !signedUrlPayload.publicUrl ||
      !signedUrlPayload.token
    ) {
      throw new Error(signedUrlPayload.error || '업로드용 주소를 만들지 못했습니다.')
    }

    setUploadProgress(20)
    await uploadToSupabaseSignedUrl(
      {
        bucket: signedUrlPayload.bucket,
        filePath: signedUrlPayload.filePath,
        publicUrl: signedUrlPayload.publicUrl,
        token: signedUrlPayload.token,
      },
      file
    )

    replaceLocalPreviewUrl(null)
    setValue(signedUrlPayload.publicUrl)
    setCoverImageIntent('set')
    setUploadPhase('ready')
    setUploadProgress(100)
    setMessage(`커버 이미지가 ${formatFileSize(file.size)} WebP로 업로드되어 저장 대기 상태로 반영되었습니다.`)
  }

  async function handleFilesSelected(files: File[]) {
    const [file] = files

    if (!file) {
      return
    }

    setIsUploading(true)

    try {
      const preparedFile = await prepareCoverFile(file)

      if (!preparedFile) {
        replaceLocalPreviewUrl(null)
        return
      }

      await uploadFile(preparedFile)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '업로드 중 문제가 발생했습니다.'
      setUploadPhase('idle')
      setUploadProgress(0)
      setMessage(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  function clearCoverImage() {
    setValue('')
    setCoverImageIntent('clear')
    replaceLocalPreviewUrl(null)
    setInspectionMessages([])
    setUploadPhase('idle')
    setUploadProgress(0)
    setMessage('커버 이미지를 비웠습니다. 저장하면 커버 없이 반영됩니다.')
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="coverImageUrl" value={value} readOnly />
      <input type="hidden" name="coverImageIntent" value={coverImageIntent} readOnly />

      <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-zinc-500">
        {guideItems.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>

      <ImageUploadDropzone
        title="커버 이미지 올리기"
        description={
          channelId
            ? '파일을 올리면 공개 URL이 자동으로 입력됩니다. 저장 버튼까지 눌러야 최종 반영됩니다.'
            : `새 ${workLabel} 단계에서도 커버를 먼저 업로드한 뒤, 저장 시 이미지 주소만 함께 반영됩니다.`
        }
        disabled={false}
        isUploading={isUploading}
        buttonLabel="커버 이미지 고르기"
        preserveSelection={false}
        onFilesSelected={handleFilesSelected}
      />

      {inspectionMessages.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-zinc-400">
          {inspectionMessages.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      ) : null}

      {uploadPhase !== 'idle' ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-zinc-400">
            <span>{uploadPhaseLabel}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-300 transition-[width] duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
        {previewUrl
          ? '업로드된 커버 이미지가 저장 대기 상태입니다. 아래 미리보기에서 바로 확인할 수 있습니다.'
          : '파일 업로드가 기본 방식입니다. 기존 이미지 주소가 이미 있다면 아래 고급 옵션에서 직접 넣을 수 있습니다.'}
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
              onChange={(event) => {
                const nextValue = event.target.value
                setValue(nextValue)
                setCoverImageIntent(nextValue.trim().length > 0 ? 'set' : 'clear')
                replaceLocalPreviewUrl(null)
                setUploadPhase('idle')
                setUploadProgress(0)
              }}
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
          <img src={previewUrl} alt={`${workLabel} cover preview`} className="h-56 w-full object-cover" />
        ) : (
          <div className="flex h-56 items-center justify-center px-6 text-center text-sm leading-6 text-zinc-500">
            업로드되거나 입력된 커버 이미지가 이곳에 미리보기로 표시됩니다.
          </div>
        )}
      </div>

      {previewUrl ? (
        <button
          type="button"
          onClick={clearCoverImage}
          disabled={isUploading}
          className="inline-flex w-fit rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          커버 이미지 제거
        </button>
      ) : null}
    </div>
  )
}
