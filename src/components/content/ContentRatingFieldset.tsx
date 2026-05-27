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
  }

  const handleAgeRatingChange = (nextRating: ChannelAgeRating) => {
    if (nextRating === '19') {
      if (!adultNoticeAccepted) {
        if (ageRating !== '19') {
          setFallbackRating(ageRating)
        }

        setShowAdultNotice(true)
        return
      }

      setAgeRating(nextRating)
      return
    }

    setAgeRating(nextRating)
    setAdultNoticeAccepted(false)
  }

  const cancelAdultNotice = () => {
    setShowAdultNotice(false)
    setAgeRating(fallbackRating)
    setAdultNoticeAccepted(false)
  }

  const acceptAdultNotice = () => {
    if (!adultNoticeAccepted) {
      return
    }

    setAgeRating('19')
    setShowAdultNotice(false)
  }

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
            <label
              key={option.value}
              className={`cursor-pointer rounded-2xl border p-4 transition ${
                ageRating === option.value
                  ? 'border-emerald-400/40 bg-emerald-500/10'
                  : 'border-white/10 bg-black/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={ageRating === option.value}
                  onChange={() => handleAgeRatingChange(option.value)}
                  className="mt-1 h-4 w-4 border-white/20 bg-black/30"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{option.label}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{option.description}</p>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {RATING_CHECKLIST_FIELDS.map((field) => (
            <fieldset key={field.key} className="grid gap-2 text-sm text-zinc-300">
              <legend>{field.label}</legend>
              <div className="grid grid-cols-2 gap-2">
                {RATING_INTENSITY_OPTIONS.map((option) => {
                  const isSelected = ratingChecklist[field.key] === option.value

                  return (
                    <label
                      key={`${field.key}-${option.value}`}
                      className={`cursor-pointer rounded-2xl border px-3 py-3 text-center text-sm transition ${
                        isSelected
                          ? 'border-emerald-400/40 bg-emerald-500/15 text-white'
                          : 'border-white/10 bg-black/25 text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`rating-${field.key}`}
                        value={option.value}
                        checked={isSelected}
                        onChange={() => updateChecklist(field.key, option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  )
                })}
              </div>
            </fieldset>
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

      {showAdultNotice ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="adult-rating-notice-title"
        >
          <div className="w-full max-w-xl rounded-[32px] border border-rose-400/20 bg-[#0b0b0b] p-6 text-white shadow-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">19+ Notice</p>
            <h3 id="adult-rating-notice-title" className="mt-3 text-2xl font-bold">
              19세 이상 성인 작품 안내
            </h3>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300">
              <p>이 등급을 선택하면 작품은 성인 인증이 완료된 이용자에게만 노출됩니다.</p>
              <p>작가는 관련 법령과 플랫폼 정책에 맞는 게시 책임을 직접 확인해야 합니다.</p>
              <p>등급을 낮게 설정한 채 실제 수위를 숨기면 노출 제한이나 운영 조치가 발생할 수 있습니다.</p>
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={adultNoticeAccepted}
                onChange={(event) => setAdultNoticeAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
              />
              <span>법적 책임과 성인 인증 필수 안내를 확인했습니다.</span>
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={cancelAdultNotice}
                className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                다시 선택하기
              </button>
              <button
                type="button"
                onClick={acceptAdultNotice}
                disabled={!adultNoticeAccepted}
                className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                확인하고 계속하기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
