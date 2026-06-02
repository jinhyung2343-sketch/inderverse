'use client'

import { useMemo, useState } from 'react'
import { FilePickerButton, ImageUploadDropzone } from '@/components/upload/ImageUploadDropzone'
import type { SparkFormat, SparkPanel } from '@/lib/spark'
import { getSparkFormatLabel } from '@/lib/spark'
import { uploadToSupabaseSignedUrl } from '@/lib/storage/client-upload'

const formatOptions = [
  {
    value: 'single_cut',
    label: '싱글 스파크',
    summary: '한 장으로 완결되는 짧은 스파크',
  },
  {
    value: 'four_cut',
    label: '4컷 스파크',
    summary: '네 칸으로 이어지는 짧은 서사',
  },
] as const

const emptyPanels = Array.from({ length: 4 }, () => ({
  imageUrl: '',
  caption: '',
}))

function getRequiredPanelCount(format: SparkFormat) {
  return format === 'four_cut' ? 4 : 1
}

function normalizePanels(initialPanels: SparkPanel[]) {
  const merged = [...emptyPanels].map((panel, index) => ({
    imageUrl: initialPanels[index]?.imageUrl ?? panel.imageUrl,
    caption: panel.caption,
  }))

  return merged.slice(0, 4)
}

export function SparkPanelField({
  channelId,
  initialPanels,
  initialFormat,
}: {
  channelId?: string
  initialPanels: SparkPanel[]
  initialFormat: SparkFormat
}) {
  const [format, setFormat] = useState<SparkFormat>(initialFormat)
  const [panels, setPanels] = useState(() => normalizePanels(initialPanels))
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [isBatchUploading, setIsBatchUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const activePanelCount = getRequiredPanelCount(format)

  const panelsJson = useMemo(() => JSON.stringify(panels), [panels])

  function updatePanel(index: number, key: keyof SparkPanel, value: string) {
    setPanels((current) =>
      current.map((panel, panelIndex) =>
        panelIndex === index
          ? {
              ...panel,
              [key]: value,
            }
          : panel
      )
    )
  }

  async function uploadPanelAtIndex(index: number, file: File) {
    if (!file || !channelId) {
      return
    }

    setMessage(null)
    setUploadingIndex(index)

    try {
      const signedUrlResponse = await fetch('/api/upload/spark-panel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          panelIndex: index,
          contentType: file.type,
        }),
      })

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
        throw new Error(signedUrlPayload.error || '패널 업로드용 주소를 만들지 못했습니다.')
      }

      await uploadToSupabaseSignedUrl(
        {
          bucket: signedUrlPayload.bucket,
          filePath: signedUrlPayload.filePath,
          publicUrl: signedUrlPayload.publicUrl,
          token: signedUrlPayload.token,
        },
        file
      )

      updatePanel(index, 'imageUrl', signedUrlPayload.publicUrl)
      setMessage(`${index + 1}번 컷 이미지가 업로드되었습니다.`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '패널 업로드 중 문제가 발생했습니다.'
      setMessage(errorMessage)
    } finally {
      setUploadingIndex(null)
    }
  }

  async function handleBatchFilesSelected(files: File[]) {
    if (files.length === 0) {
      return
    }

    if (!channelId) {
      const previewFiles = files.slice(0, activePanelCount)

      setPanels((current) =>
        current.map((panel, index) => ({
          ...panel,
          imageUrl: previewFiles[index] ? URL.createObjectURL(previewFiles[index]) : panel.imageUrl,
        }))
      )
      setMessage(
        format === 'single_cut'
          ? '대표 컷 이미지를 먼저 미리보고 있습니다. 스파크를 저장하면 업로드가 함께 진행됩니다.'
          : '선택한 컷 이미지를 먼저 미리보고 있습니다. 스파크를 저장하면 업로드가 함께 진행됩니다.'
      )
      return
    }

    const uploadTargets = files.slice(0, activePanelCount)
    const skippedCount = Math.max(0, files.length - uploadTargets.length)

    setIsBatchUploading(true)
    setMessage(null)

    try {
      for (const [index, file] of uploadTargets.entries()) {
        await uploadPanelAtIndex(index, file)
      }

      setMessage(
        skippedCount > 0
          ? `${uploadTargets.length}개의 공개 컷을 먼저 채웠고, 나머지 ${skippedCount}개 파일은 현재 포맷 기준으로 보류했습니다.`
          : `${uploadTargets.length}개의 공개 컷 이미지가 순서대로 업로드되었습니다.`
      )
    } finally {
      setIsBatchUploading(false)
    }
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="format" value={format} readOnly />
      <input type="hidden" name="panelsJson" value={panelsJson} readOnly />

      <div className="grid gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Format</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">제작 형식</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {formatOptions.map((option) => {
            const isSelected = option.value === format

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                aria-pressed={isSelected}
                className={`rounded-3xl border p-5 text-left transition ${
                  isSelected
                    ? 'border-white/40 bg-white text-black'
                    : 'border-white/10 bg-black/20 text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-lg font-bold">{option.label}</span>
                <span className={`mt-2 block text-sm leading-6 ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>
                  {option.summary}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <ImageUploadDropzone
        title={format === 'single_cut' ? '대표 컷 올리기' : '4컷 이미지 올리기'}
        description={
          channelId
            ? format === 'single_cut'
              ? '한 장을 대표 컷으로 사용합니다.'
              : '여러 장을 한 번에 선택하면 1번 컷부터 차례대로 채워집니다.'
            : format === 'single_cut'
              ? '저장 전 대표 컷을 미리 확인합니다.'
              : '저장 전 4컷 배치를 미리 확인합니다.'
        }
        disabled={false}
        multiple={format === 'four_cut'}
        isUploading={isBatchUploading || uploadingIndex !== null}
        buttonLabel={format === 'single_cut' ? '대표 컷 고르기' : '컷 여러 장 고르기'}
        inputName={channelId ? undefined : 'pendingSparkPanelFiles'}
        preserveSelection={!channelId}
        onFilesSelected={handleBatchFilesSelected}
      />

      <div className="grid gap-4">
        {panels.slice(0, activePanelCount).map((panel, index) => {
          return (
            <section
              key={`panel-${index}`}
              className="rounded-3xl border border-white/10 bg-white/5 p-4 transition"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {format === 'single_cut' ? getSparkFormatLabel(format) : `${index + 1}번 컷`}
                    </p>
                  </div>
                  <FilePickerButton
                    label="이 컷 고르기"
                    disabled={!channelId || uploadingIndex !== null}
                    isUploading={uploadingIndex === index}
                    onFilesSelected={async (files) => {
                      const [file] = files

                      if (!file) {
                        return
                      }

                      await uploadPanelAtIndex(index, file)
                    }}
                  />
                </div>

                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-400">
                  {panel.imageUrl
                    ? '이 컷 이미지는 업로드되었거나 직접 입력되어 준비된 상태입니다.'
                    : '파일 업로드를 기본으로 사용하고, 필요할 때만 아래 고급 옵션에서 직접 주소를 입력하세요.'}
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                  {panel.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={panel.imageUrl} alt={`${index + 1}번 컷 미리보기`} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center px-6 text-center text-sm leading-6 text-zinc-500">
                      아직 등록된 컷 이미지가 없습니다.
                    </div>
                  )}
                </div>

                <details className="rounded-2xl border border-white/10 bg-black/20">
                  <summary className="cursor-pointer px-4 py-3 text-sm text-zinc-300">
                    고급 옵션: {index + 1}번 컷 주소 직접 입력
                  </summary>
                  <div className="border-t border-white/10 px-4 py-4">
                    <label className="grid gap-2 text-sm text-zinc-300">
                      <span>컷 이미지 URL</span>
                      <input
                        value={panel.imageUrl}
                        onChange={(event) => updatePanel(index, 'imageUrl', event.target.value)}
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

      {message ? <p className="text-sm leading-6 text-zinc-400">{message}</p> : null}
    </div>
  )
}
