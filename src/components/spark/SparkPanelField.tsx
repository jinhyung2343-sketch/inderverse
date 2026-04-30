'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SparkFormat, SparkPanel } from '@/lib/spark'
import { getSparkFormatLabel } from '@/lib/spark'

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

  async function handleFileChange(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

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
        error?: string
        url?: string
        publicUrl?: string
      }

      if (!signedUrlResponse.ok || !signedUrlPayload.url || !signedUrlPayload.publicUrl) {
        throw new Error(signedUrlPayload.error || '패널 업로드용 주소를 만들지 못했습니다.')
      }

      const uploadResponse = await fetch(signedUrlPayload.url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('패널 이미지 업로드에 실패했습니다.')
      }

      updatePanel(index, 'imageUrl', signedUrlPayload.publicUrl)
      setMessage(`${index + 1}번 컷 이미지가 업로드되었습니다.`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '패널 업로드 중 문제가 발생했습니다.'
      setMessage(errorMessage)
    } finally {
      setUploadingIndex(null)
      event.target.value = ''
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
                  <label
                    className={`inline-flex w-fit rounded-full px-4 py-2 text-sm transition ${
                      channelId
                        ? 'cursor-pointer border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                        : 'cursor-not-allowed border border-white/10 bg-black/30 text-zinc-600'
                    }`}
                  >
                    {uploadingIndex === index ? '업로드 중...' : '컷 업로드'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => void handleFileChange(index, event)}
                      disabled={!channelId || uploadingIndex !== null}
                      className="hidden"
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-sm text-zinc-300">
                  <span>컷 이미지 URL</span>
                  <input
                    value={panel.imageUrl}
                    onChange={(event) => updatePanel(index, 'imageUrl', event.target.value)}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                    placeholder="https://..."
                  />
                </label>

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
              </div>
            </section>
          )
        })}
      </div>

      {message ? <p className="text-sm leading-6 text-zinc-400">{message}</p> : null}
    </div>
  )
}
