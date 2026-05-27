'use client'

import { useMemo, useState } from 'react'
import {
  AGE_RATING_OPTIONS,
  DEFAULT_RATING_CHECKLIST,
  getAgeRatingLabel,
  getSuggestedAgeRating,
  isAgeRatingAtLeast,
  type ChannelAgeRating,
  type RatingChecklist,
  RATING_INTENSITY_OPTIONS,
} from '@/lib/content-rating'

const RATING_CHECKLIST_FIELDS: Array<{
  key: keyof RatingChecklist
  label: string
}> = [
  { key: 'sexualContent', label: '선정성' },
  { key: 'violence', label: '폭력성' },
  { key: 'language', label: '언어 수위' },
]

export function ContentRatingFieldset({
  initialAgeRating = 'all',
  initialChecklist = DEFAULT_RATING_CHECKLIST,
  sectionTitle = '작품 등급 분류',
}: {
  initialAgeRating?: ChannelAgeRating
  initialChecklist?: RatingChecklist
  sectionTitle?: string
}) {
  const [ageRating, setAgeRating] = useState<ChannelAgeRating>(initialAgeRating)
  const [ratingChecklist, setRatingChecklist] = useState<RatingChecklist>(initialChecklist)
  const [adultNoticeAccepted, setAdultNoticeAccepted] = useState(initialAgeRating === '19')
  const [showAdultNotice, setShowAdultNotice] = useState(false)
  const [openChecklistKey, setOpenChecklistKey] = useState<keyof RatingChecklist | null>(null)
  const [fallbackRating, setFallbackRating] = useState<ChannelAgeRating>(
    initialAgeRating === '19' ? '15' : initialAgeRating
  )

  const suggestedAgeRating = useMemo(
    () => getSuggestedAgeRating(ratingChecklist),
    [ratingChecklist]
  )
  const isBelowSuggestedRating = !isAgeRatingAtLeast(ageRating, suggestedAgeRating)

  const updateChecklist = (key: keyof RatingChecklist, value: RatingChecklist[keyof RatingChecklist]) => {
    setRatingChecklist((current) => ({
      ...current,
      [key]: value,
    }))
    setOpenChecklistKey(null)
  }

  const handleAgeRatingChange = (nextRating: ChannelAgeRating) => {
    if (nextRating === '19') {
      if (!adultNoticeAccepted) {
        if (ageRating !== '19') {
          setFallbackRating(ageRating)
        }

        setAgeRating(nextRating)
        setShowAdultNotice(true)
        return
      }

      setAgeRating(nextRating)
      return
    }

    setAgeRating(nextRating)
    setAdultNoticeAccepted(false)
    setShowAdultNotice(false)
  }

  const cancelAdultNotice = () => {
    setShowAdultNotice(false)
    setAgeRating(fallbackRating)
    setAdultNoticeAccepted(false)
  }

  const acceptAdultNotice = () => {
    setAdultNoticeAccepted(true)
    setAgeRating('19')
    setShowAdultNotice(false)
  }

  const getIntensityLabel = (value: RatingChecklist[keyof RatingChecklist]) =>
    RATING_INTENSITY_OPTIONS.find((option) => option.value === value)?.label ?? value

  return (
    <>
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Age Rating</p>
          <h2 className="text-2xl font-bold tracking-tight text-white">{sectionTitle}</h2>
          <p className="text-sm leading-6 text-zinc-400">
            작품 전체의 연령 등급을 먼저 정하고, 선정성·폭력성·언어 수위를 자가 체크해 주세요. 19세 이상
            성인 작품은 성인 인증 노출과 법적 책임 안내를 반드시 확인해야 합니다.
          </p>
        </div>

        <input type="hidden" name="ageRating" value={ageRating} />
        <input type="hidden" name="ratingChecklistJson" value={JSON.stringify(ratingChecklist)} />
        <input
          type="hidden"
          name="adultContentNoticeAccepted"
          value={ageRating === '19' && adultNoticeAccepted ? 'on' : ''}
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {AGE_RATING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleAgeRatingChange(option.value)}
              aria-pressed={ageRating === option.value}
              className={`cursor-pointer rounded-2xl border p-4 transition ${
                ageRating === option.value
                  ? 'border-emerald-400/40 bg-emerald-500/10'
                  : 'border-white/10 bg-black/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 inline-flex h-4 w-4 shrink-0 rounded-full border ${
                    ageRating === option.value ? 'border-emerald-300 bg-emerald-300' : 'border-white/20 bg-black/30'
                  }`}
                  aria-hidden="true"
                />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{option.label}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {ageRating === '19' && showAdultNotice && !adultNoticeAccepted ? (
          <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
            <p className="font-semibold text-white">19세 이상 성인 작품 안내</p>
            <p className="mt-2 text-rose-50/90">
              이 등급을 선택하면 작품은 성인 인증이 완료된 이용자에게만 노출됩니다. 확인하면 법적 책임과 성인
              인증 필수 안내를 확인한 것으로 처리됩니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={cancelAdultNotice}
                className="inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold text-rose-50 transition hover:bg-white/10"
              >
                다시 선택하기
              </button>
              <button
                type="button"
                onClick={acceptAdultNotice}
                className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
              >
                고지 확인
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {RATING_CHECKLIST_FIELDS.map((field) => (
            <div key={field.key} className="relative text-sm text-zinc-300">
              <button
                type="button"
                onClick={() =>
                  setOpenChecklistKey((current) => (current === field.key ? null : field.key))
                }
                aria-expanded={openChecklistKey === field.key}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition hover:bg-white/10"
              >
                <span className="font-semibold text-white">{field.label}</span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-50">
                  {getIntensityLabel(ratingChecklist[field.key])}
                </span>
              </button>

              {openChecklistKey === field.key ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 grid gap-1 rounded-2xl border border-white/10 bg-[#0b0b0b] p-2 shadow-2xl">
                  {RATING_INTENSITY_OPTIONS.map((option) => {
                    const isSelected = ratingChecklist[field.key] === option.value

                    return (
                      <button
                        key={`${field.key}-${option.value}`}
                        type="button"
                        onClick={() => updateChecklist(field.key, option.value)}
                        aria-pressed={isSelected}
                        className={`cursor-pointer rounded-xl px-3 py-2 text-left text-sm transition ${
                          isSelected
                            ? 'bg-emerald-500/15 text-white'
                            : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-500/5 p-4 text-sm leading-6 text-zinc-200">
          <p>
            체크 기준 추천 등급: <span className="font-semibold text-white">{getAgeRatingLabel(suggestedAgeRating)}</span>
          </p>
          <p className="mt-1 text-zinc-400">
            현재 선택: <span className="font-semibold text-white">{getAgeRatingLabel(ageRating)}</span>
          </p>
        </div>

        {isBelowSuggestedRating ? (
          <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            현재 체크 수준으로 보면 최소 {getAgeRatingLabel(suggestedAgeRating)} 등급이 더 자연스럽습니다.
            선택 등급을 다시 확인해 주세요.
          </p>
        ) : null}

        {ageRating === '19' && adultNoticeAccepted ? (
          <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            19세 이상 성인 작품은 성인 인증 노출이 자동으로 필요해지며, 관련 법령과 게시 책임을 작가가 함께
            부담합니다.
          </p>
        ) : null}
      </div>
    </>
  )
}
