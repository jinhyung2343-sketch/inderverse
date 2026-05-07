'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getJoinPromptHref, LOGIN_REQUIRED_MESSAGE } from '@/lib/guest-policy'
import { useAuthStore } from '@/stores/auth'

const FEEDBACK_DRAFT_KEY = 'inderverse:community-feedback-draft'

const categoryOptions = [
  { value: 'bug', label: '버그 제보' },
  { value: 'idea', label: '기능 제안' },
  { value: 'community', label: '커뮤니티 의견' },
] as const

export function CommunityFeedbackPanel() {
  const { isLoggedIn, checkSession } = useAuthStore()
  const [draft] = useState(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const rawDraft = window.localStorage.getItem(FEEDBACK_DRAFT_KEY)

    if (!rawDraft) {
      return null
    }

    try {
      return JSON.parse(rawDraft) as {
        category?: (typeof categoryOptions)[number]['value']
        message?: string
      }
    } catch {
      window.localStorage.removeItem(FEEDBACK_DRAFT_KEY)
      return null
    }
  })
  const [category, setCategory] = useState<(typeof categoryOptions)[number]['value']>(
    draft?.category ?? 'idea'
  )
  const [message, setMessage] = useState(draft?.message ?? '')
  const [statusMessage, setStatusMessage] = useState('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const handleSaveDraft = () => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      FEEDBACK_DRAFT_KEY,
      JSON.stringify({
        category,
        message,
      })
    )
    setStatusMessage('의견 초안을 이 브라우저에 임시 저장했습니다.')
  }

  const handleCopy = async () => {
    if (typeof window === 'undefined') {
      return
    }

    const categoryLabel =
      categoryOptions.find((option) => option.value === category)?.label ?? category

    await window.navigator.clipboard.writeText(`[${categoryLabel}]\n${message.trim()}`)
    setStatusMessage('의견 내용을 클립보드에 복사했습니다.')
  }

  const handleReset = () => {
    setCategory('idea')
    setMessage('')
    setStatusMessage('입력한 초안을 비웠습니다.')

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(FEEDBACK_DRAFT_KEY)
    }
  }

  const isMessageEmpty = message.trim().length === 0

  if (!isLoggedIn) {
    return (
      <>
        <section
          id="feedback"
          className="h-fit scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.06] p-6"
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Feedback</p>
            <h2 className="text-2xl font-bold tracking-tight text-white">의견 남기기</h2>
            <p className="text-sm leading-6 text-zinc-400">
              서비스에 바라는 점이나 개선 아이디어를 남길 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLoginPrompt(true)}
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            의견 작성하기
          </button>
        </section>

        {showLoginPrompt ? (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-login-required-title"
          >
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#080808] p-6 text-center shadow-2xl shadow-black/50">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Login Required</p>
              <h2 id="community-login-required-title" className="mt-4 text-2xl font-bold tracking-tight text-white">
                {LOGIN_REQUIRED_MESSAGE}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                의견 작성은 로그인 후 사용할 수 있습니다.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoginPrompt(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
                >
                  취소
                </button>
                <Link
                  href={getJoinPromptHref('/community')}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  로그인
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <section
      id="feedback"
      className="h-fit scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.06] p-6"
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Feedback</p>
        <h2 className="text-2xl font-bold tracking-tight text-white">의견 남기기</h2>
        <p className="text-sm leading-6 text-zinc-400">
          느낀 점과 개선 아이디어를 남겨주세요. 초안 저장과 복사를 지원합니다.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm text-zinc-300">
          <span>의견 종류</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as (typeof categoryOptions)[number]['value'])
            }
            className="min-h-12 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-zinc-300">
          <span>내용</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={8}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30"
            placeholder="예: 작품별 소식과 플랫폼 공지를 더 쉽게 구분하고 싶어요."
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          className="inline-flex min-h-11 items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          초안 저장
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={isMessageEmpty}
          className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          내용 복사
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
        >
          비우기
        </button>
      </div>

      <p className="mt-5 border-l border-sky-400/30 pl-4 text-sm leading-6 text-zinc-300">
        의견은 운영 공지와 작품 알림 개선에 참고됩니다.
        {statusMessage ? <span className="mt-2 block text-sky-100">{statusMessage}</span> : null}
      </p>
    </section>
  )
}
