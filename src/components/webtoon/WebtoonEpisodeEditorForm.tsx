'use client'

import { EpisodeImagesField } from '@/components/webtoon/EpisodeImagesField'
import type { Json } from '@/lib/supabase/types'
import type { CreatorWebtoonEpisodeRecord } from '@/lib/webtoon'
import { getEpisodeStatusLabel } from '@/lib/webtoon'
import {
  getWebtoonEpisodeDraftKey,
  type WorkDraftRecord,
} from '@/lib/work-drafts'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'

const statusOptions = ['draft', 'published', 'hidden'] as const
const WEBTOON_EPISODE_DRAFT_TYPE = 'webtoon_episode'
const SHORT_WEBTOON_MAX_CUT_COUNT = 220

interface EpisodeFormDraft {
  title: string
  episodeNumber: string
  pricingType: string
  coinPrice: string
  status: string
  images: Json[]
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

function getDraftTimestamp(draft: Partial<EpisodeFormDraft> | null | undefined) {
  if (!draft?.savedAt) {
    return 0
  }

  const time = new Date(draft.savedAt).getTime()
  return Number.isNaN(time) ? 0 : time
}

function parseEpisodeDraft(rawDraft: string, rawImages: string | null): EpisodeFormDraft {
  const draft = JSON.parse(rawDraft) as Partial<EpisodeFormDraft>

  return {
    title: typeof draft.title === 'string' ? draft.title : '',
    episodeNumber: typeof draft.episodeNumber === 'string' ? draft.episodeNumber : '',
    pricingType: typeof draft.pricingType === 'string' ? draft.pricingType : 'paid',
    coinPrice: typeof draft.coinPrice === 'string' ? draft.coinPrice : '0',
    status: typeof draft.status === 'string' ? draft.status : 'draft',
    images: Array.isArray(draft.images)
      ? draft.images
      : parseSerializableImages(rawImages),
    savedAt: typeof draft.savedAt === 'string' ? draft.savedAt : '',
  }
}

function parseSerializableImages(value: FormDataEntryValue | string | null): Json[] {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry, index) => {
        const imageUrl = typeof entry.imageUrl === 'string' && !entry.imageUrl.startsWith('blob:')
          ? entry.imageUrl
          : ''

        return {
          ...entry,
          imageUrl,
          sortOrder: index,
          status: imageUrl ? entry.status : 'empty',
          pendingFile: null,
          errorMessage: null,
        } as Json
      })
  } catch {
    return []
  }
}

async function fetchServerEpisodeDraft(draftKey: string) {
  const params = new URLSearchParams({
    draftType: WEBTOON_EPISODE_DRAFT_TYPE,
    draftKey,
  })
  const response = await fetch(`/api/studio/work-drafts?${params.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as {
    draft?: WorkDraftRecord<Json> | null
  }

  if (!payload.draft || typeof payload.draft.payload !== 'object' || !payload.draft.payload || Array.isArray(payload.draft.payload)) {
    return null
  }

  return parseEpisodeDraft(JSON.stringify(payload.draft.payload), null)
}

async function saveServerEpisodeDraft({
  channelId,
  draft,
  draftKey,
  episodeId,
}: {
  channelId: string
  draft: EpisodeFormDraft
  draftKey: string
  episodeId?: string
}) {
  await fetch('/api/studio/work-drafts', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channelId,
      episodeId,
      draftType: WEBTOON_EPISODE_DRAFT_TYPE,
      draftKey,
      payload: draft,
    }),
  })
}

async function deleteServerEpisodeDraft(draftKey: string) {
  await fetch('/api/studio/work-drafts', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      draftType: WEBTOON_EPISODE_DRAFT_TYPE,
      draftKey,
    }),
  })
}

export function WebtoonEpisodeEditorForm({
  action,
  channelId,
  episodeId,
  initialValue,
  heading,
  description,
  isShortForm = false,
  submitLabel,
  workTitle,
}: {
  action: (formData: FormData) => void | Promise<void>
  channelId: string
  episodeId?: string
  initialValue?: CreatorWebtoonEpisodeRecord
  heading: string
  description: string
  isShortForm?: boolean
  submitLabel: string
  workTitle?: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isAutoSavePaused, setIsAutoSavePaused] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdEpisodePath, setCreatedEpisodePath] = useState<string | null>(null)
  const [isSubmittingNewEpisode, setIsSubmittingNewEpisode] = useState(false)
  const lastServerDraftJsonRef = useRef<string | null>(null)
  const draftStorageKey = useMemo(
    () => `inderverse:webtoon-episode-draft:${channelId}:${episodeId ?? 'new'}`,
    [channelId, episodeId]
  )
  const serverDraftKey = useMemo(
    () => getWebtoonEpisodeDraftKey(channelId, episodeId),
    [channelId, episodeId]
  )
  const imagesDraftStorageKey = `${draftStorageKey}:images`
  const defaultShortEpisodeTitle = workTitle?.trim() || '단편 툰'

  useEffect(() => {
    let isMounted = true

    async function loadDraft() {
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
          deleteServerEpisodeDraft(getWebtoonEpisodeDraftKey(channelId, 'new')).catch(() => {
            // Server draft cleanup is best-effort after a confirmed save.
          })
          deleteServerEpisodeDraft(serverDraftKey).catch(() => {
            // Server draft cleanup is best-effort after a confirmed save.
          })
          url.searchParams.delete('saved')
          window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)

          if (isMounted) {
            setIsAutoSavePaused(true)
            setDraftLoaded(true)
          }
          return
        }

        const rawLocalDraft = window.localStorage.getItem(draftStorageKey)
        const rawLocalImages = window.localStorage.getItem(imagesDraftStorageKey)
        const localDraft = rawLocalDraft ? parseEpisodeDraft(rawLocalDraft, rawLocalImages) : null
        const serverDraft = await fetchServerEpisodeDraft(serverDraftKey)
        const nextDraft =
          getDraftTimestamp(serverDraft) > getDraftTimestamp(localDraft)
            ? serverDraft
            : localDraft

        if (!isMounted) {
          return
        }

        if (!nextDraft) {
          setDraftLoaded(true)
          return
        }

        const textFields = ['title', 'episodeNumber', 'pricingType', 'coinPrice', 'status'] as const

        textFields.forEach((name) => {
          const element = form.elements.namedItem(name)
          const value = nextDraft[name]

          if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement
          ) {
            if (typeof value === 'string' && value.length > 0) {
              element.value = value
            }
          }
        })

        if (nextDraft.images.length > 0) {
          window.localStorage.setItem(imagesDraftStorageKey, JSON.stringify(nextDraft.images))
        }

        setLastSavedAt(nextDraft.savedAt || null)
        setDraftRestored(true)
        lastServerDraftJsonRef.current = JSON.stringify(nextDraft)
        setDraftLoaded(true)
      } catch {
        window.localStorage.removeItem(draftStorageKey)

        if (isMounted) {
          setIsAutoSavePaused(true)
          setDraftLoaded(true)
        }
      }
    }

    loadDraft()

    return () => {
      isMounted = false
    }
  }, [channelId, draftStorageKey, imagesDraftStorageKey, serverDraftKey])

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
        images: parseSerializableImages(formData.get('imagesJson')),
        savedAt,
      }

      try {
        const draftJson = JSON.stringify(draft)

        window.localStorage.setItem(draftStorageKey, draftJson)
        setLastSavedAt(savedAt)

        if (lastServerDraftJsonRef.current !== draftJson) {
          lastServerDraftJsonRef.current = draftJson
          saveServerEpisodeDraft({
            channelId,
            draft,
            draftKey: serverDraftKey,
            episodeId,
          }).catch(() => {
            lastServerDraftJsonRef.current = null
          })
        }
      } catch {
        setLastSavedAt(null)
      }
    }, 2000)

    return () => window.clearInterval(intervalId)
  }, [channelId, draftLoaded, draftStorageKey, episodeId, isAutoSavePaused, serverDraftKey])

  function clearLocalDraft() {
    window.localStorage.removeItem(draftStorageKey)
    window.localStorage.removeItem(imagesDraftStorageKey)
    deleteServerEpisodeDraft(serverDraftKey).catch(() => {
      // Server draft cleanup is best-effort from the browser.
    })
    lastServerDraftJsonRef.current = null
    setDraftRestored(false)
    setLastSavedAt(null)
    setIsAutoSavePaused(true)
  }

  async function handleFormAction(formData: FormData) {
    await action(formData)
    clearLocalDraft()
  }

  function getPendingEpisodeImageFiles(formData: FormData) {
    return formData
      .getAll('pendingEpisodeImageFiles')
      .filter((value): value is File => value instanceof File && value.size > 0)
  }

  async function uploadPersistedEpisodeImage({
    createdEpisodeId,
    file,
    sortOrder,
  }: {
    createdEpisodeId: string
    file: File
    sortOrder: number
  }) {
    const uploadFormData = new FormData()
    uploadFormData.set('channelId', channelId)
    uploadFormData.set('episodeId', createdEpisodeId)
    uploadFormData.set('sortOrder', String(sortOrder))
    uploadFormData.set('persistImage', 'on')
    uploadFormData.set('file', file)

    const uploadResponse = await fetch('/api/upload/webtoon-episode-image', {
      method: 'POST',
      body: uploadFormData,
    })
    const uploadPayload = (await uploadResponse.json()) as { error?: string; imageUrl?: string }

    if (!uploadResponse.ok || !uploadPayload.imageUrl) {
      throw new Error(uploadPayload.error || `${sortOrder + 1}번째 이미지 업로드에 실패했습니다.`)
    }
  }

  async function handleNewEpisodeSubmit(event: FormEvent<HTMLFormElement>) {
    if (episodeId) {
      return
    }

    event.preventDefault()

    const form = formRef.current

    if (!form || isSubmittingNewEpisode) {
      return
    }

    const formData = new FormData(form)
    const pendingFiles = getPendingEpisodeImageFiles(formData)

    setSubmitError(null)
    setSubmitMessage(
      isShortForm ? '단편 원고 정보를 먼저 저장하고 있습니다.' : '회차 정보를 먼저 저장하고 있습니다.',
    )
    setCreatedEpisodePath(null)
    setIsSubmittingNewEpisode(true)

    try {
      const createResponse = await fetch('/api/studio/webtoon-episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          title: String(formData.get('title') ?? ''),
          episodeNumber: String(formData.get('episodeNumber') ?? ''),
          pricingType: String(formData.get('pricingType') ?? 'paid'),
          coinPrice: String(formData.get('coinPrice') ?? '0'),
          status: String(formData.get('status') ?? 'draft'),
          pendingImageCount: pendingFiles.length,
        }),
      })
      const createPayload = (await createResponse.json()) as {
        editPath?: string
        episodeId?: string
        error?: string
      }

      if (!createResponse.ok || !createPayload.episodeId || !createPayload.editPath) {
        throw new Error(createPayload.error || '회차를 저장하지 못했습니다.')
      }

      setCreatedEpisodePath(createPayload.editPath)

      for (const [index, file] of pendingFiles.entries()) {
        setSubmitMessage(`${pendingFiles.length}장 중 ${index + 1}번째 이미지를 업로드하고 있습니다.`)
        await uploadPersistedEpisodeImage({
          createdEpisodeId: createPayload.episodeId,
          file,
          sortOrder: index,
        })
      }

      clearLocalDraft()
      await deleteServerEpisodeDraft(serverDraftKey)
      window.location.assign(`${createPayload.editPath}?saved=1`)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isShortForm
            ? '단편 원고 저장 중 문제가 발생했습니다.'
            : '회차 저장 중 문제가 발생했습니다.',
      )
      setSubmitMessage(null)
    } finally {
      setIsSubmittingNewEpisode(false)
    }
  }

  function resumeAutoSave() {
    if (isAutoSavePaused) {
      setIsAutoSavePaused(false)
    }
  }

  return (
    <form
      ref={formRef}
      action={episodeId ? handleFormAction : undefined}
      onSubmit={handleNewEpisodeSubmit}
      onInput={resumeAutoSave}
      onChange={resumeAutoSave}
      className="grid gap-6"
    >
      <input type="hidden" name="serverDraftType" value={WEBTOON_EPISODE_DRAFT_TYPE} />
      <input type="hidden" name="serverDraftKey" value={serverDraftKey} />
      <section className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Episode Upload</p>
            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">{heading}</h1>
            <p className="max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>
          </div>
          {workTitle ? (
            <div className="w-fit rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold text-zinc-300">
              {workTitle}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.82fr_2.18fr]">
        <input type="hidden" name="pricingType" value="paid" />
        <input type="hidden" name="coinPrice" value="0" />
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white">
              {isShortForm ? '단편 공개 설정' : '회차 기본값'}
            </h2>
            <div className="mt-5 grid gap-4">
              {isShortForm ? (
                <>
                  <input type="hidden" name="title" defaultValue={initialValue?.title ?? defaultShortEpisodeTitle} />
                  <input type="hidden" name="episodeNumber" defaultValue={initialValue?.episodeNumber ?? 1} />
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
                    단편 툰은 한 편으로 공개되므로 회차 제목과 번호를 따로 입력하지 않습니다. 원고 이미지를 순서대로
                    업로드하면 이 작품의 본편으로 저장됩니다.
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>저장 상태</span>
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
            </div>
          </div>

          <div className="rounded-[24px] border border-emerald-300/15 bg-emerald-500/5 p-5 text-sm leading-6 text-zinc-300">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-emerald-100">계정 초안 자동저장</p>
                <p className="mt-1 text-zinc-400">
                  {isShortForm
                    ? '단편 원고 설정과 업로드 완료 이미지 순서를 계정 서버 초안과 이 브라우저에 함께 저장합니다. 마지막 저장: '
                    : '회차 입력값과 업로드 완료 이미지 순서를 계정 서버 초안과 이 브라우저에 함께 저장합니다. 마지막 저장: '}
                  {formatDraftSavedAt(lastSavedAt)}
                </p>
                {isAutoSavePaused ? (
                  <p className="mt-2 text-zinc-500">
                    초안을 삭제했습니다. 내용을 다시 수정하면 자동저장이 재개됩니다.
                  </p>
                ) : null}
                {draftRestored ? (
                  <p className="mt-2 text-amber-100">
                    이전에 저장된 초안을 복구했습니다. 업로드 완료 이미지는 다른 기기에서도 이어지고, 아직 업로드 전인 로컬 파일은 다시 선택해야 합니다.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={clearLocalDraft}
                className="inline-flex w-fit rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                초안 삭제
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-sky-400/20 bg-sky-500/5 p-5 text-sm leading-6 text-zinc-300">
            {isShortForm
              ? '작품 등급과 공개 기준은 이전 단계에서 정한 값을 따릅니다. 단편 원고는 먼저 본편 정보를 저장한 뒤, 선택한 이미지를 한 장씩 안정적으로 업로드합니다.'
              : '작품 등급과 공개 기준은 이전 단계에서 정한 값을 따릅니다. 새 회차는 먼저 회차 정보를 저장한 뒤, 선택한 이미지를 한 장씩 안정적으로 업로드합니다.'}
          </div>

          {submitMessage ? (
            <div className="rounded-[24px] border border-emerald-300/15 bg-emerald-500/5 p-5 text-sm leading-6 text-emerald-100">
              {submitMessage}
            </div>
          ) : null}

          {submitError ? (
            <div className="rounded-[24px] border border-rose-300/25 bg-rose-500/10 p-5 text-sm leading-6 text-rose-100">
              <p>{submitError}</p>
              {createdEpisodePath ? (
                <a
                  href={createdEpisodePath}
                  className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold text-rose-50 transition hover:bg-white/10"
                >
                  {isShortForm ? '저장된 단편 원고 편집으로 이동' : '저장된 회차 편집으로 이동'}
                </a>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmittingNewEpisode}
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmittingNewEpisode
              ? isShortForm
                ? '단편 원고 저장 중...'
                : '회차 저장 중...'
              : submitLabel}
          </button>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:p-6">
          <h2 className="text-xl font-bold text-white">{isShortForm ? '원고 이미지' : '회차 이미지'}</h2>
          <div className="mt-5">
            {draftLoaded ? (
              <EpisodeImagesField
                channelId={channelId}
                episodeId={episodeId}
                initialImages={initialValue?.images ?? []}
                draftStorageKey={imagesDraftStorageKey}
                maxImageCount={isShortForm ? SHORT_WEBTOON_MAX_CUT_COUNT : undefined}
                imageUnitLabel={isShortForm ? '컷' : '장'}
              />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
                {isShortForm ? '저장된 단편 원고 초안을 확인하고 있습니다.' : '저장된 회차 초안을 확인하고 있습니다.'}
              </div>
            )}
          </div>
        </div>
      </section>
    </form>
  )
}
