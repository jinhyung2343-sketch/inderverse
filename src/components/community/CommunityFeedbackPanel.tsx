'use client'

import { useState } from 'react'

const FEEDBACK_DRAFT_KEY = 'inderverse:community-feedback-draft'

const categoryOptions = [
  { value: 'bug', label: '버그 제보' },
  { value: 'idea', label: '기능 제안' },
  { value: 'community', label: '커뮤니티 의견' },
] as const

export function CommunityFeedbackPanel() {
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

  return (
    <section
      id="feedback"
      className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl scroll-mt-24"
    >
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Feedback</p>
        <h2 className="text-2xl font-bold text-white">의견 남기기</h2>
        <p className="max-w-2xl text-sm leading-6 text-zinc-400">
          아직 서버 전송 폼은 열지 않았지만, 느낀 점과 개선 아이디어를 바로 정리할 수 있게 초안 패널을
          먼저 준비했습니다.
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
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
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
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
            placeholder="예: 커뮤니티에서 공지와 알림을 구분해서 보고 싶어요. 작품별 소식과 플랫폼 공지가 섞이지 않게 탭이 있으면 좋겠습니다."
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          초안 저장
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={isMessageEmpty}
          className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          내용 복사
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
        >
          비우기
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm leading-6 text-zinc-200">
        <p>다음 단계 예정: 커뮤니티 운영 공지와 일반 알림을 분리한 피드, 실제 의견 전송 API 연결</p>
        {statusMessage ? <p className="mt-2 text-sky-100">{statusMessage}</p> : null}
      </div>
    </section>
  )
}
