'use client'

import { useEffect, useMemo, useState } from 'react'
import { FilePickerButton, ImageUploadDropzone } from '@/components/upload/ImageUploadDropzone'
import type { SparkFormat, SparkPanel } from '@/lib/spark'
import { getSparkFormatLabel } from '@/lib/spark'
import { uploadToSupabaseSignedUrl } from '@/lib/storage/client-upload'

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
    caption: initialPanels[index]?.caption ?? panel.caption,
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

  useEffect(() => {
    const selectElement = document.querySelector<HTMLSelectElement>('select[name="format"]')

    if (!selectElement) {
      return
    }

    const syncFormat = () => {
      const nextValue = selectElement.value === 'four_cut' ? 'four_cut' : 'single_cut'
      setFormat(nextValue)
    }

    syncFormat()
    selectElement.addEventListener('change', syncFormat)

    return () => {
      selectElement.removeEventListener('change', syncFormat)
    }
  }, [])

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
      <input type="hidden" name="panelsJson" value={panelsJson} readOnly />

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
        현재 포맷은 <span className="font-semibold text-white">{getSparkFormatLabel(format)}</span> 입니다.
        {format === 'single_cut'
          ? ' 첫 번째 컷만 실제 공개 패널로 사용됩니다.'
          : ' 4개의 컷이 모두 공개 패널로 사용됩니다.'}
      </div>

      <ImageUploadDropzone
        title="컷 이미지 올리기"
        description={
          channelId
            ? format === 'single_cut'
              ? '한 장을 바로 대표 컷으로 올릴 수 있습니다. 여러 장을 선택하면 첫 번째 파일만 현재 공개 컷에 반영됩니다.'
              : '여러 장을 한 번에 선택하면 1번 컷부터 차례대로 채워집니다.'
            : '새 스파크 단계에서도 먼저 컷 이미지를 골라 배치를 확인할 수 있습니다. 저장 시 실제 업로드가 이어집니다.'
        }
        disabled={false}
        multiple
        isUploading={isBatchUploading || uploadingIndex !== null}
        buttonLabel={format === 'single_cut' ? '대표 컷 고르기' : '컷 여러 장 고르기'}
        inputName={channelId ? undefined : 'pendingSparkPanelFiles'}
        preserveSelection={!channelId}
        onFilesSelected={handleBatchFilesSelected}
      />

      <div className="grid gap-4">
        {panels.map((panel, index) => {
          const isActivePanel = index < activePanelCount

          return (
            <section
              key={`panel-${index}`}
              className={`rounded-3xl border p-4 transition ${
                isActivePanel
                  ? 'border-white/10 bg-white/5'
                  : 'border-white/5 bg-black/20 opacity-60'
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{index + 1}번 컷</p>
                    <p className="text-xs text-zinc-500">
                      {isActivePanel
                        ? '이 컷은 현재 포맷에서 실제 공개 대상입니다.'
                        : '포맷을 4컷으로 바꾸면 이 컷도 공개 대상에 포함됩니다.'}
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

                <label className="grid gap-2 text-sm text-zinc-300">
                  <span>컷 설명 / 자막</span>
                  <textarea
                    value={panel.caption}
                    onChange={(event) => updatePanel(index, 'caption', event.target.value)}
                    rows={3}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                    placeholder="컷 아래에 보일 설명이나 짧은 자막"
                  />
                </label>

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
