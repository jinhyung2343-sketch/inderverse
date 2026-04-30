'use client'

import { useEffect, useState } from 'react'

interface SparkEngagementState {
  viewCount: number
  applauseCount: number
  saved: boolean
  saveCount: number
  canSave: boolean
}

function getAnonId() {
  if (typeof window === 'undefined') {
    return null
  }

  const key = 'inderverse-anon-id'
  const existing = window.localStorage.getItem(key)

  if (existing) {
    return existing
  }

  const nextValue = crypto.randomUUID()
  window.localStorage.setItem(key, nextValue)
  return nextValue
}

export function SparkEngagementPanel({
  sparkId,
  sparkTitle,
  initialState,
}: {
  sparkId: string
  sparkTitle: string
  initialState: SparkEngagementState
}) {
  const [engagement, setEngagement] = useState<SparkEngagementState>(initialState)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    async function trackView() {
      try {
        const response = await fetch('/api/spark/engagement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sparkId,
            action: 'view',
            anonId: getAnonId(),
          }),
        })

        const payload = (await response.json()) as {
          summary?: {
            viewCount: number
            applauseCount: number
            saveCount: number
            viewerHasSaved: boolean
            viewerCanSave: boolean
          }
        }

        if (response.ok && payload.summary) {
          setEngagement({
            viewCount: payload.summary.viewCount,
            applauseCount: payload.summary.applauseCount,
            saved: payload.summary.viewerHasSaved,
            saveCount: payload.summary.saveCount,
            canSave: payload.summary.viewerCanSave,
          })
        }
      } catch {
        // Keep initial server metrics if the view event fails.
      }
    }

    void trackView()
  }, [sparkId])

  async function runAction(action: 'applause' | 'toggle_save') {
    setIsPending(true)

    try {
      const response = await fetch('/api/spark/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sparkId,
          action,
          anonId: getAnonId(),
        }),
      })

      const payload = (await response.json()) as {
        error?: string
        summary?: {
          viewCount: number
          applauseCount: number
          saveCount: number
          viewerHasSaved: boolean
          viewerCanSave: boolean
        }
      }

      if (!response.ok || !payload.summary) {
        throw new Error(payload.error || '반응을 처리하지 못했습니다.')
      }

      setEngagement({
        viewCount: payload.summary.viewCount,
        applauseCount: payload.summary.applauseCount,
        saved: payload.summary.viewerHasSaved,
        saveCount: payload.summary.saveCount,
        canSave: payload.summary.viewerCanSave,
      })

      if (action === 'applause') {
        setStatusMessage(`"${sparkTitle}"에 박수를 보냈습니다.`)
      } else {
        setStatusMessage(payload.summary.viewerHasSaved ? '이 스파크를 저장했습니다.' : '저장을 해제했습니다.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '처리 중 문제가 발생했습니다.'
      setStatusMessage(message)
    } finally {
      setIsPending(false)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setStatusMessage('현재 스파크 링크를 복사했습니다.')
    } catch {
      setStatusMessage('링크 복사에 실패했습니다. 브라우저 권한을 확인해 주세요.')
    }
  }

  function handleApplause() {
    void runAction('applause')
  }

  function handleSave() {
    if (!engagement.canSave) {
      setStatusMessage('스파크 저장은 로그인 후 사용할 수 있습니다.')
      return
    }

    void runAction('toggle_save')
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Engagement</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">읽은 흐름과 반응</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        이제 조회, 박수, 저장 수치를 서버 기준으로 집계합니다. 저장은 로그인한 사용자에게만 연결됩니다.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Views</p>
          <p className="mt-2 text-2xl font-black text-white">{engagement.viewCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Applause</p>
          <p className="mt-2 text-2xl font-black text-white">{engagement.applauseCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Saves</p>
          <p className="mt-2 text-2xl font-black text-white">{engagement.saveCount}</p>
          <p className="mt-2 text-sm text-zinc-400">{engagement.saved ? '내 저장 목록에 있음' : '아직 저장 안 함'}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleApplause}
          disabled={isPending}
          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          {isPending ? '처리 중...' : '박수 보내기'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
        >
          {engagement.saved ? '저장 해제' : '스파크 저장'}
        </button>
        <button
          type="button"
          onClick={() => void handleCopyLink()}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
        >
          링크 복사
        </button>
      </div>

      {statusMessage ? <p className="mt-4 text-sm leading-6 text-zinc-400">{statusMessage}</p> : null}
    </section>
  )
}
