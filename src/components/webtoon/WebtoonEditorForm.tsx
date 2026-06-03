'use client'

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useFormStatus } from 'react-dom'
import type { WebtoonChannelActionState } from '@/app/main/studio/channels/actions'
import { ContentRatingFieldset } from '@/components/content/ContentRatingFieldset'
import { FreeArchiveConfirmField } from '@/components/studio/FreeArchiveConfirmField'
import {
  DEFAULT_RATING_CHECKLIST,
  isChannelAgeRating,
  sanitizeRatingChecklist,
  type ChannelAgeRating,
  type RatingChecklist,
} from '@/lib/content-rating'
import { categories } from '@/lib/explore'
import type { CreatorWebtoonRecord, WorkScale } from '@/lib/webtoon'
import {
  FLEXIBLE_SERIALIZATION_LABEL,
  getSerializationDayLabel,
  getWebtoonStatusLabel,
  getWorkScaleLabel,
} from '@/lib/webtoon'
import { WebtoonCoverField } from '@/components/webtoon/WebtoonCoverField'
import type { Json } from '@/lib/supabase/types'
import {
  getWebtoonChannelDraftKey,
  getWebtoonChannelDraftResetSignalKey,
  getWebtoonChannelDraftStorageKey,
  type WorkDraftRecord,
} from '@/lib/work-drafts'

const weekdayOptions = [0, 1, 2, 3, 4, 5, 6] as const
const statusOptions = ['draft', 'publishing', 'completed'] as const
const categoryOptions = categories.filter((category) => category !== '전체')
const workScaleOptions = ['short', 'medium', 'long'] as const
const initialActionState: WebtoonChannelActionState = { error: null }
const WEBTOON_CHANNEL_DRAFT_TYPE = 'webtoon_channel'

interface WebtoonChannelFormDraft {
  title: string
  description: string
  coverImageUrl: string
  category: string
  status: string
  tags: string
  serializationDays: string[]
  workScale: string
  teaserPercentage: string
  isFreeArchive: boolean
  isCommentEnabled: boolean
  commentPolicyNote: string
  ageRating: ChannelAgeRating
  ratingChecklist: RatingChecklist
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

function parseDraft(rawDraft: string) {
  const parsed = JSON.parse(rawDraft) as Partial<WebtoonChannelFormDraft>
  const rawAgeRating = typeof parsed.ageRating === 'string' ? parsed.ageRating : ''
  const ageRating = isChannelAgeRating(rawAgeRating) ? rawAgeRating : 'all'

  return {
    title: typeof parsed.title === 'string' ? parsed.title : '',
    description: typeof parsed.description === 'string' ? parsed.description : '',
    coverImageUrl: typeof parsed.coverImageUrl === 'string' ? parsed.coverImageUrl : '',
    category: typeof parsed.category === 'string' ? parsed.category : '드라마',
    status: typeof parsed.status === 'string' ? parsed.status : 'draft',
    tags: typeof parsed.tags === 'string' ? parsed.tags : '',
    serializationDays: Array.isArray(parsed.serializationDays)
      ? parsed.serializationDays.filter((value): value is string => typeof value === 'string')
      : [],
    workScale: typeof parsed.workScale === 'string' ? parsed.workScale : 'medium',
    teaserPercentage: typeof parsed.teaserPercentage === 'string' ? parsed.teaserPercentage : '10',
    isFreeArchive: parsed.isFreeArchive === true,
    isCommentEnabled: parsed.isCommentEnabled !== false,
    commentPolicyNote: typeof parsed.commentPolicyNote === 'string' ? parsed.commentPolicyNote : '',
    ageRating,
    ratingChecklist: sanitizeRatingChecklist(parsed.ratingChecklist),
    savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
  } satisfies WebtoonChannelFormDraft
}

function getDraftTimestamp(draft: WebtoonChannelFormDraft | null | undefined) {
  if (!draft?.savedAt) {
    return 0
  }

  const time = new Date(draft.savedAt).getTime()
  return Number.isNaN(time) ? 0 : time
}

function isServerChannelDraftPayload(value: Json) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function fetchServerChannelDraft(draftKey: string) {
  const params = new URLSearchParams({
    draftType: WEBTOON_CHANNEL_DRAFT_TYPE,
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

  if (!payload.draft || !isServerChannelDraftPayload(payload.draft.payload)) {
    return null
  }

  return parseDraft(JSON.stringify(payload.draft.payload))
}

async function saveServerChannelDraft({
  channelId,
  draft,
  draftKey,
}: {
  channelId?: string
  draft: WebtoonChannelFormDraft
  draftKey: string
}) {
  await fetch('/api/studio/work-drafts', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channelId,
      draftType: WEBTOON_CHANNEL_DRAFT_TYPE,
      draftKey,
      payload: draft,
    }),
  })
}

async function deleteServerChannelDraft(draftKey: string) {
  await fetch('/api/studio/work-drafts', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      draftType: WEBTOON_CHANNEL_DRAFT_TYPE,
      draftKey,
    }),
  })
}

function parseRatingChecklistJson(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return DEFAULT_RATING_CHECKLIST
  }

  try {
    return sanitizeRatingChecklist(JSON.parse(value))
  } catch {
    return DEFAULT_RATING_CHECKLIST
  }
}

function SubmitButton({
  disabled = false,
  disabledLabel,
  label,
}: {
  disabled?: boolean
  disabledLabel?: string
  label: string
}) {
  const { pending } = useFormStatus()
  const isDisabled = pending || disabled

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? '저장 중...' : disabled ? (disabledLabel ?? label) : label}
    </button>
  )
}

export function WebtoonEditorForm({
  action,
  initialValue,
  heading,
  description,
  lockedWorkScale,
  submitLabel,
  channelId,
  restoreDrafts = true,
  showContentRatingFieldset = true,
}: {
  action: (
    previousState: WebtoonChannelActionState,
    formData: FormData
  ) => WebtoonChannelActionState | Promise<WebtoonChannelActionState>
  initialValue?: CreatorWebtoonRecord
  heading: string
  description: string
  lockedWorkScale?: WorkScale
  submitLabel: string
  channelId?: string
  restoreDrafts?: boolean
  showContentRatingFieldset?: boolean
}) {
  const [state, formAction] = useActionState(action, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isAutoSavePaused, setIsAutoSavePaused] = useState(false)
  const [isCoverUploading, setIsCoverUploading] = useState(false)
  const [coverUploadWarning, setCoverUploadWarning] = useState<string | null>(null)
  const [localDraft, setLocalDraft] = useState<WebtoonChannelFormDraft | null>(null)
  const lastServerDraftJsonRef = useRef<string | null>(null)
  const draftStorageKey = useMemo(
    () => getWebtoonChannelDraftStorageKey(channelId),
    [channelId]
  )
  const draftResetSignalKey = useMemo(
    () => getWebtoonChannelDraftResetSignalKey(channelId),
    [channelId]
  )
  const serverDraftKey = useMemo(
    () => getWebtoonChannelDraftKey(channelId),
    [channelId]
  )

  useEffect(() => {
    let isMounted = true

    async function loadDraft() {
      let shouldDeleteServerDraft = false

      try {
        const url = new URL(window.location.href)
        const clearDraftKey = url.searchParams.get('clearDraftKey')
        const shouldResetDeletedDraft =
          !channelId && window.sessionStorage.getItem(draftResetSignalKey) === '1'
        const shouldClearSavedDraft =
          clearDraftKey === draftStorageKey ||
          url.searchParams.get('saved') === '1' ||
          shouldResetDeletedDraft ||
          !restoreDrafts

        if (shouldClearSavedDraft) {
          window.localStorage.removeItem(draftStorageKey)
          window.sessionStorage.removeItem(draftResetSignalKey)
          shouldDeleteServerDraft = true
          url.searchParams.delete('clearDraftKey')
          url.searchParams.delete('saved')
          window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)

          if (isMounted) {
            setLocalDraft(null)
            setDraftRestored(false)
            setLastSavedAt(null)
            setIsAutoSavePaused(true)
            setDraftLoaded(true)
          }
          return
        }

        const rawLocalDraft = window.localStorage.getItem(draftStorageKey)
        const localDraft = rawLocalDraft ? parseDraft(rawLocalDraft) : null
        const serverDraft = await fetchServerChannelDraft(serverDraftKey)
        const nextDraft =
          getDraftTimestamp(serverDraft) > getDraftTimestamp(localDraft)
            ? serverDraft
            : localDraft

        if (!isMounted) {
          return
        }

        if (nextDraft) {
          setLocalDraft(nextDraft)
          setLastSavedAt(nextDraft.savedAt || null)
          setDraftRestored(true)
          lastServerDraftJsonRef.current = JSON.stringify(nextDraft)
        }

        setDraftLoaded(true)
      } catch {
        window.localStorage.removeItem(draftStorageKey)

        if (isMounted) {
          setDraftLoaded(true)
        }
      } finally {
        if (shouldDeleteServerDraft) {
          deleteServerChannelDraft(serverDraftKey).catch(() => {
            // Server draft cleanup is best-effort after a confirmed save.
          })
        }
      }
    }

    loadDraft()

    return () => {
      isMounted = false
    }
  }, [channelId, draftResetSignalKey, draftStorageKey, restoreDrafts, serverDraftKey])

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
      const draft: WebtoonChannelFormDraft = {
        title: String(formData.get('title') ?? ''),
        description: String(formData.get('description') ?? ''),
        coverImageUrl: String(formData.get('coverImageUrl') ?? ''),
        category: String(formData.get('category') ?? '드라마'),
        status: String(formData.get('status') ?? 'draft'),
        tags: String(formData.get('tags') ?? ''),
        serializationDays: formData
          .getAll('serializationDays')
          .map((value) => String(value)),
        workScale: lockedWorkScale ?? String(formData.get('workScale') ?? 'medium'),
        teaserPercentage: String(formData.get('teaserPercentage') ?? '10'),
        isFreeArchive: formData.get('isFreeArchive') === 'on',
        isCommentEnabled: formData.get('isCommentEnabled') === 'on',
        commentPolicyNote: String(formData.get('commentPolicyNote') ?? ''),
        ageRating: isChannelAgeRating(String(formData.get('ageRating') ?? ''))
          ? (String(formData.get('ageRating')) as ChannelAgeRating)
          : 'all',
        ratingChecklist: parseRatingChecklistJson(formData.get('ratingChecklistJson')),
        savedAt,
      }

      try {
        const draftJson = JSON.stringify(draft)

        window.localStorage.setItem(draftStorageKey, draftJson)
        setLastSavedAt(savedAt)

        if (lastServerDraftJsonRef.current !== draftJson) {
          lastServerDraftJsonRef.current = draftJson
          saveServerChannelDraft({
            channelId,
            draft,
            draftKey: serverDraftKey,
          }).catch(() => {
            lastServerDraftJsonRef.current = null
          })
        }
      } catch {
        setLastSavedAt(null)
      }
    }, 2000)

    return () => window.clearInterval(intervalId)
  }, [channelId, draftLoaded, draftStorageKey, isAutoSavePaused, lockedWorkScale, serverDraftKey])

  function clearLocalDraft() {
    window.localStorage.removeItem(draftStorageKey)
    deleteServerChannelDraft(serverDraftKey).catch(() => {
      // Server draft cleanup is best-effort from the browser.
    })
    lastServerDraftJsonRef.current = null
    setLocalDraft(null)
    setDraftRestored(false)
    setLastSavedAt(null)
    setIsAutoSavePaused(true)
  }

  function resumeAutoSave() {
    if (isAutoSavePaused) {
      setIsAutoSavePaused(false)
    }
  }

  const handleCoverUploadStateChange = useCallback((nextIsUploading: boolean) => {
    setIsCoverUploading(nextIsUploading)

    if (!nextIsUploading) {
      setCoverUploadWarning(null)
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isCoverUploading) {
      return
    }

    event.preventDefault()
    setCoverUploadWarning('커버 이미지 업로드가 끝난 뒤 저장해 주세요.')
  }

  function handleFlexibleSerializationChange(checked: boolean) {
    if (!checked) {
      return
    }

    const form = formRef.current

    if (!form) {
      return
    }

    form.querySelectorAll<HTMLInputElement>('input[name="serializationDays"]').forEach((input) => {
      if (input.value !== 'flexible') {
        input.checked = false
      }
    })
  }

  function handleWeekdaySerializationChange(checked: boolean) {
    if (!checked) {
      return
    }

    const flexibleInput = formRef.current?.querySelector<HTMLInputElement>(
      'input[name="serializationDays"][value="flexible"]'
    )

    if (flexibleInput) {
      flexibleInput.checked = false
    }
  }

  if (!draftLoaded) {
    return (
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300 backdrop-blur-xl">
        저장된 작성 내용을 확인하고 있습니다.
      </section>
    )
  }

  const initialSerializationDays =
    localDraft?.serializationDays.map((value) => Number.parseInt(value, 10)).filter((value) =>
      Number.isInteger(value)
    ) ?? initialValue?.serializationDays ?? []
  const isFlexibleSerialization =
    localDraft?.serializationDays.includes('flexible') ?? initialSerializationDays.length === 0
  const initialTags =
    localDraft?.tags ?? initialValue?.tags.filter((tag) => tag !== initialValue.category).join(', ') ?? ''
  const initialCoverImageUrl = localDraft?.coverImageUrl ?? initialValue?.coverImageUrl ?? ''
  const initialAgeRating = localDraft?.ageRating ?? initialValue?.ageRating ?? 'all'
  const initialWorkScale = lockedWorkScale ?? localDraft?.workScale ?? initialValue?.workScale ?? 'medium'
  const initialChecklist =
    localDraft?.ratingChecklist ?? initialValue?.ratingChecklist ?? DEFAULT_RATING_CHECKLIST

  return (
    <form
      ref={formRef}
      action={formAction}
      onInput={resumeAutoSave}
      onChange={resumeAutoSave}
      onSubmit={handleSubmit}
      className="grid gap-6"
    >
      <input type="hidden" name="draftStorageKey" value={draftStorageKey} />
      <input type="hidden" name="serverDraftType" value={WEBTOON_CHANNEL_DRAFT_TYPE} />
      <input type="hidden" name="serverDraftKey" value={serverDraftKey} />

      {!showContentRatingFieldset ? (
        <>
          <input type="hidden" name="ageRating" value="all" />
          <input
            type="hidden"
            name="ratingChecklistJson"
            value='{"sexualContent":"none","violence":"none","language":"none"}'
          />
          <input type="hidden" name="adultContentNoticeAccepted" value="" />
        </>
      ) : null}

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Webtoon Editor</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{heading}</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{description}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_1.85fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">기본 정보</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>작품 제목</span>
                <input
                  name="title"
                  required
                  defaultValue={localDraft?.title ?? initialValue?.title ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="웹툰 제목"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>작품 설명</span>
                <textarea
                  name="description"
                  required
                  defaultValue={localDraft?.description ?? initialValue?.description ?? ''}
                  rows={7}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="작품의 세계관, 분위기, 독자에게 먼저 보여주고 싶은 맥락을 적어주세요."
                />
              </label>

              <div className="grid gap-2 text-sm text-zinc-300">
                <span>커버 이미지</span>
                <WebtoonCoverField
                  key={initialCoverImageUrl}
                  channelId={channelId}
                  initialValue={initialCoverImageUrl}
                  onUploadStateChange={handleCoverUploadStateChange}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">공개 설정</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>카테고리</span>
                <select
                  name="category"
                  defaultValue={localDraft?.category ?? initialValue?.category ?? '드라마'}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>상태</span>
                <select
                  name="status"
                  defaultValue={localDraft?.status ?? initialValue?.status ?? 'draft'}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {getWebtoonStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm text-zinc-300">
              <span>탐색 태그</span>
              <input
                name="tags"
                defaultValue={initialTags}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="도시환상, 군상극, 청춘"
              />
            </label>

            <div className="mt-4 grid gap-3 text-sm text-zinc-300">
              <p className="text-white">연재 요일</p>
              <label className="inline-flex w-fit cursor-pointer">
                <input
                  type="checkbox"
                  name="serializationDays"
                  value="flexible"
                  defaultChecked={isFlexibleSerialization}
                  onChange={(event) => handleFlexibleSerializationChange(event.currentTarget.checked)}
                  aria-label={FLEXIBLE_SERIALIZATION_LABEL}
                  title={FLEXIBLE_SERIALIZATION_LABEL}
                  className="h-10 w-10 cursor-pointer appearance-none rounded-full border border-emerald-300/25 bg-emerald-500/10 transition hover:bg-emerald-500/15 checked:border-emerald-300 checked:bg-emerald-300"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {weekdayOptions.map((day) => {
                  const checked = initialSerializationDays.includes(day)

                  return (
                    <label
                      key={day}
                      className="inline-flex cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="serializationDays"
                        value={String(day)}
                        defaultChecked={checked}
                        onChange={(event) => handleWeekdaySerializationChange(event.currentTarget.checked)}
                        aria-label={getSerializationDayLabel(day)}
                        title={getSerializationDayLabel(day)}
                        className="h-10 w-10 cursor-pointer appearance-none rounded-full border border-white/15 bg-black/20 transition hover:bg-white/10 checked:border-white checked:bg-white"
                      />
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {lockedWorkScale ? (
                <input type="hidden" name="workScale" value={lockedWorkScale} />
              ) : (
                <label className="grid gap-2 text-sm text-zinc-300">
                  <span>작품 규모</span>
                  <select
                    name="workScale"
                    defaultValue={initialWorkScale}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  >
                    {workScaleOptions.map((option) => (
                      <option key={option} value={option}>
                        {getWorkScaleLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>맛보기 공개 비율 (%)</span>
                <input
                  type="number"
                  min={3}
                  max={20}
                  name="teaserPercentage"
                  defaultValue={localDraft?.teaserPercentage ?? initialValue?.teaserPercentage ?? 10}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                />
              </label>
            </div>

            <FreeArchiveConfirmField
              key={String(localDraft?.isFreeArchive ?? initialValue?.isFreeArchive ?? false)}
              defaultChecked={localDraft?.isFreeArchive ?? initialValue?.isFreeArchive ?? false}
            />
          </div>

          {showContentRatingFieldset ? (
            <ContentRatingFieldset
              initialAgeRating={initialAgeRating}
              initialChecklist={initialChecklist}
            />
          ) : (
            <div className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
              작품 등급은 저장 직후 이어지는 전용 단계에서 확정합니다. 지금은 기본 메타데이터와 연재 운용 기준을
              먼저 저장합니다.
            </div>
          )}

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">커뮤니티 정책</h2>
            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <input
                type="checkbox"
                name="isCommentEnabled"
                defaultChecked={localDraft?.isCommentEnabled ?? initialValue?.isCommentEnabled ?? true}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
              />
              <span>이 작품의 댓글을 공개 상태로 운영합니다.</span>
            </label>

            <label className="mt-4 grid gap-2 text-sm text-zinc-300">
              <span>댓글 안내 문구</span>
              <textarea
                name="commentPolicyNote"
                defaultValue={localDraft?.commentPolicyNote ?? initialValue?.commentPolicyNote ?? ''}
                rows={4}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="감상 위주의 댓글만 허용합니다, 스포일러는 자제해 주세요 같은 운영 문구"
              />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">맛보기/구독 공개 기준</h2>
            <div className="mt-5 grid gap-3 text-sm text-zinc-300">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <span className="font-semibold text-white">맛보기 공개</span>
                <p className="mt-1 text-zinc-400">총 회차 수와 설정한 비율을 기준으로 최소 1화가 무료 공개됩니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <span className="font-semibold text-white">구독 공개</span>
                <p className="mt-1 text-zinc-400">맛보기 이후 회차는 구독자에게만 열립니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <span className="font-semibold text-white">무료 아카이브</span>
                <p className="mt-1 text-zinc-400">체크하면 맛보기 비율과 무관하게 모든 공개 회차를 누구나 볼 수 있습니다.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
            {channelId
              ? '채널 저장 후 아래 회차 섹션에서 실제 공개용 에피소드를 추가할 수 있습니다. 커버 이미지는 Supabase Storage에 올라가고, 메타데이터는 Supabase에 남습니다.'
              : '새 웹툰 채널은 먼저 저장한 뒤, 다음 화면에서 회차 생성과 이미지 업로드까지 이어서 진행하면 됩니다.'}
          </div>

          <div className="rounded-[32px] border border-emerald-300/15 bg-emerald-500/5 p-6 text-sm leading-6 text-zinc-300">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-emerald-100">계정 초안 자동저장</p>
                <p className="mt-1 text-zinc-400">
                  작품 제목, 설명, 장르, 커버 URL, 연재 요일을 계정 서버 초안과 이 브라우저에 함께 저장합니다. 마지막 저장:{' '}
                  {formatDraftSavedAt(lastSavedAt)}
                </p>
                {isAutoSavePaused ? (
                  <p className="mt-2 text-zinc-500">
                    초안을 삭제했습니다. 내용을 다시 수정하면 자동저장이 재개됩니다.
                  </p>
                ) : null}
                {draftRestored ? (
                  <p className="mt-2 text-amber-100">
                    이전에 작성하던 작품 정보를 복구했습니다. 다른 기기에서 이어 작성한 내용일 수 있으니 확인한 뒤 저장해 주세요.
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

          {state.error ? (
            <div className="rounded-3xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
              {state.error}
            </div>
          ) : null}

          {coverUploadWarning ? (
            <div className="rounded-3xl border border-amber-300/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
              {coverUploadWarning}
            </div>
          ) : null}

          <SubmitButton
            label={submitLabel}
            disabled={isCoverUploading}
            disabledLabel="커버 업로드 중..."
          />
        </div>
      </section>
    </form>
  )
}
