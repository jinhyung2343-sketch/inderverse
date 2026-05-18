'use client'

import { EpisodeImagesField } from '@/components/webtoon/EpisodeImagesField'
import type { CreatorWebtoonEpisodeRecord } from '@/lib/webtoon'
import { getEpisodeStatusLabel } from '@/lib/webtoon'
import { useEffect, useMemo, useRef, useState } from 'react'

const statusOptions = ['draft', 'published', 'hidden'] as const

interface EpisodeFormDraft {
  title: string
  episodeNumber: string
  pricingType: string
  coinPrice: string
  status: string
  isAdultOnly: boolean
  savedAt: string
}

function formatDraftSavedAt(value: string | null) {
  if (!value) {
    return '아직 저장 전'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '저장 시각 확인 전'
  }

  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function WebtoonEpisodeEditorForm({
  action,
  channelId,
  episodeId,
  initialValue,
  heading,
  description,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>
  channelId: string
  episodeId?: string
  initialValue?: CreatorWebtoonEpisodeRecord
  heading: string
  description: string
  submitLabel: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isAutoSavePaused, setIsAutoSavePaused] = useState(false)
  const draftStorageKey = useMemo(
    () => `inderverse:webtoon-episode-draft:${channelId}:${episodeId ?? 'new'}`,
    [channelId, episodeId]
  )
  const imagesDraftStorageKey = `${draftStorageKey}:images`

  useEffect(() => {
    const form = formRef.current

    if (!form) {
      return
    }

    try {
      const url = new URL(window.location.href)
      const shouldClearSavedDraft = url.searchParams.get('saved') === '1'

      if (shouldClearSavedDraft) {
        const newEpisodeDraftKey = `inderverse:webtoon-episode-draft:${channelId}:new`

        window.localStorage.removeItem(newEpisodeDraftKey)
        window.localStorage.removeItem(`${newEpisodeDraftKey}:images`)
        window.localStorage.removeItem(draftStorageKey)
        window.localStorage.removeItem(imagesDraftStorageKey)
        url.searchParams.delete('saved')
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
        window.setTimeout(() => {
          setIsAutoSavePaused(true)
          setDraftLoaded(true)
        }, 0)
        return
      }

      const rawDraft = window.localStorage.getItem(draftStorageKey)

      if (!rawDraft) {
        window.setTimeout(() => setDraftLoaded(true), 0)
        return
      }

      const draft = JSON.parse(rawDraft) as Partial<EpisodeFormDraft>
      const textFields = ['title', 'episodeNumber', 'pricingType', 'coinPrice', 'status'] as const

      textFields.forEach((name) => {
        const element = form.elements.namedItem(name)
        const value = draft[name]

        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement
        ) {
          if (typeof value === 'string') {
            element.value = value
          }
        }
      })

      const adultOnlyInput = form.elements.namedItem('isAdultOnly')

      if (adultOnlyInput instanceof HTMLInputElement && typeof draft.isAdultOnly === 'boolean') {
        adultOnlyInput.checked = draft.isAdultOnly
      }

      window.setTimeout(() => {
        setLastSavedAt(typeof draft.savedAt === 'string' ? draft.savedAt : null)
        setDraftRestored(true)
      }, 0)
    } catch {
      window.localStorage.removeItem(draftStorageKey)
    } finally {
      window.setTimeout(() => setDraftLoaded(true), 0)
    }
  }, [channelId, draftStorageKey, imagesDraftStorageKey])

  useEffect(() => {
    if (!draftLoaded) {
      return
    }

    const intervalId = window.setInterval(() => {
      if (isAutoSavePaused) {
        return
      }

      const form = formRef.current

      if (!form) {
        return
      }

      const formData = new FormData(form)
      const savedAt = new Date().toISOString()
      const draft: EpisodeFormDraft = {
        title: String(formData.get('title') ?? ''),
        episodeNumber: String(formData.get('episodeNumber') ?? ''),
        pricingType: String(formData.get('pricingType') ?? 'free'),
        coinPrice: String(formData.get('coinPrice') ?? ''),
        status: String(formData.get('status') ?? 'draft'),
        isAdultOnly: formData.get('isAdultOnly') === 'on',
        savedAt,
      }

      try {
        window.localStorage.setItem(draftStorageKey, JSON.stringify(draft))
        setLastSavedAt(savedAt)
      } catch {
        setLastSavedAt(null)
      }
    }, 2000)

    return () => window.clearInterval(intervalId)
  }, [draftLoaded, draftStorageKey, isAutoSavePaused])

  function clearLocalDraft() {
    window.localStorage.removeItem(draftStorageKey)
    window.localStorage.removeItem(imagesDraftStorageKey)
    setDraftRestored(false)
    setLastSavedAt(null)
    setIsAutoSavePaused(true)
  }

  async function handleFormAction(formData: FormData) {
    await action(formData)
    clearLocalDraft()
  }

  function resumeAutoSave() {
    if (isAutoSavePaused) {
      setIsAutoSavePaused(false)
    }
  }

  return (
    <form
      ref={formRef}
      action={handleFormAction}
      onInput={resumeAutoSave}
      onChange={resumeAutoSave}
      className="grid gap-6"
    >
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Episode Editor</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{heading}</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{description}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_1.95fr]">
        <input type="hidden" name="pricingType" value="paid" />
        <input type="hidden" name="coinPrice" value="0" />
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">회차 정보</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>회차 제목</span>
                <input
                  name="title"
                  required
                  defaultValue={initialValue?.title ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="1화. 첫 번째 장면"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>회차 번호</span>
                <input
                  type="number"
                  min={1}
                  name="episodeNumber"
                  required
                  defaultValue={initialValue?.episodeNumber ?? 1}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>회차 상태</span>
                <select
                  name="status"
                  defaultValue={initialValue?.status ?? 'draft'}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {getEpisodeStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name="isAdultOnly"
                  defaultChecked={initialValue?.isAdultOnly ?? false}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
                />
                <span>이 회차는 성인 인증이 필요합니다.</span>
              </label>
            </div>
          </div>

          <div className="rounded-[32px] border border-emerald-300/15 bg-emerald-500/5 p-6 text-sm leading-7 text-zinc-300">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-emerald-100">로컬 자동저장</p>
                <p className="mt-1 text-zinc-400">
                  입력값과 이미지 순서를 이 브라우저에 자동 저장합니다. 마지막 저장: {formatDraftSavedAt(lastSavedAt)}
                </p>
                {isAutoSavePaused ? (
                  <p className="mt-2 text-zinc-500">
                    로컬 초안을 삭제했습니다. 내용을 다시 수정하면 자동저장이 재개됩니다.
                  </p>
                ) : null}
                {draftRestored ? (
                  <p className="mt-2 text-amber-100">
                    이전에 저장된 초안을 복구했습니다. 서버에 올라가지 않은 로컬 파일은 다시 선택해 주세요.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={clearLocalDraft}
                className="inline-flex w-fit rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                로컬 초안 삭제
              </button>
            </div>
          </div>

          <div className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
            공개 상태의 회차는 최소 1장의 이미지가 필요합니다. 이미지는 GCS에 업로드되고, 저장하면 정렬 순서와 URL이 `episode_images`에 반영됩니다.
          </div>

          <button
            type="submit"
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {submitLabel}
          </button>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">회차 이미지</h2>
          <div className="mt-5">
            <EpisodeImagesField
              channelId={channelId}
              episodeId={episodeId}
              initialImages={initialValue?.images ?? []}
              draftStorageKey={imagesDraftStorageKey}
            />
          </div>
        </div>
      </section>
    </form>
  )
}
