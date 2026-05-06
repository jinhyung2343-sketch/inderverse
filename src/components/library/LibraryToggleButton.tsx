'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { LOGIN_REQUIRED_MESSAGE } from '@/lib/guest-policy'

export function LibraryToggleButton({
  artworkId,
  artworkTitle,
  initialSaved = false,
}: {
  artworkId: string
  artworkTitle: string
  initialSaved?: boolean
}) {
  const router = useRouter()
  const [savedOverride, setSavedOverride] = useState<boolean | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const { isLoggedIn, checkSession } = useAuthStore()
  const saved = savedOverride ?? initialSaved

  useEffect(() => {
    checkSession()
  }, [checkSession])

  async function handleToggle() {
    if (!isLoggedIn) {
      setFeedback(LOGIN_REQUIRED_MESSAGE)
      return
    }

    setIsPending(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/library/artwork-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artworkId }),
      })

      const payload = (await response.json()) as {
        error?: string
        saved?: boolean
      }

      if (!response.ok || payload.saved === undefined) {
        throw new Error(payload.error || '작품 저장을 처리하지 못했습니다.')
      }

      setSavedOverride(payload.saved)
      setFeedback(payload.saved ? `"${artworkTitle}"을 라이브러리에 저장했습니다.` : '라이브러리에서 제거했습니다.')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : '작품 저장 중 문제가 발생했습니다.'
      setFeedback(message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => void handleToggle()}
        disabled={isPending}
        aria-pressed={saved}
        aria-label={saved ? `${artworkTitle} 라이브러리에서 제거` : `${artworkTitle} 라이브러리에 저장`}
        className={`rounded-full px-5 py-3 text-sm transition ${
          saved
            ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15'
            : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {isPending ? '처리 중...' : saved ? '라이브러리에 저장됨' : '라이브러리에 담기'}
      </button>
      {feedback ? <p className="text-xs leading-5 text-zinc-500">{feedback}</p> : null}
    </div>
  )
}
