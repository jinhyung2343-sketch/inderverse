'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type StagingAgeVerificationPanelProps = {
  isLoggedIn: boolean
  isAdultVerified: boolean
  isMockEnabled: boolean
}

export function StagingAgeVerificationPanel({
  isLoggedIn,
  isAdultVerified,
  isMockEnabled,
}: StagingAgeVerificationPanelProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState('')

  async function verifyWithMockProvider() {
    if (!isLoggedIn) {
      setMessage('로그인 후 테스트 성인 인증을 진행할 수 있습니다.')
      return
    }

    if (!isMockEnabled) {
      setMessage('테스트 성인 인증은 staging 환경에서만 사용할 수 있습니다.')
      return
    }

    setIsPending(true)
    setMessage('')

    try {
      const startResponse = await fetch('/api/age-verification/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'manual',
          returnUrl: '/main/studio/safety',
        }),
      })
      const startResult = await startResponse.json().catch(() => null) as {
        error?: string
        verificationState?: string
      } | null

      if (!startResponse.ok || !startResult?.verificationState) {
        setMessage(startResult?.error ?? '테스트 인증을 시작하지 못했습니다.')
        return
      }

      const completeResponse = await fetch('/api/age-verification/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'manual',
          verificationState: startResult.verificationState,
          approved: true,
        }),
      })
      const completeResult = await completeResponse.json().catch(() => null) as { error?: string } | null

      if (!completeResponse.ok) {
        setMessage(completeResult?.error ?? '테스트 인증을 완료하지 못했습니다.')
        return
      }

      setMessage('테스트 성인 인증이 완료되었습니다.')
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className="rounded-3xl border border-sky-400/20 bg-sky-500/10 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100/70">Staging Mock</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">테스트 성인 인증</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-300">
        외부 PASS/휴대폰 인증 연동 전, 제한된 staging 테스트에서만 성인 인증 완료 상태를 가상으로 부여합니다.
      </p>
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-300">
        <p>현재 상태: <span className="font-semibold text-white">{isAdultVerified ? '성인 인증 완료' : '미인증'}</span></p>
        <p>Mock 인증: <span className="font-semibold text-white">{isMockEnabled ? '사용 가능' : '비활성'}</span></p>
      </div>
      <button
        type="button"
        onClick={verifyWithMockProvider}
        disabled={isPending || isAdultVerified || !isMockEnabled}
        className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? '인증 처리 중...' : isAdultVerified ? '이미 인증됨' : '테스트 성인 인증 완료하기'}
      </button>
      {message ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-300">
          {message}
        </p>
      ) : null}
    </section>
  )
}
