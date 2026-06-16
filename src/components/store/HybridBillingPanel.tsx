'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  formatInderium,
  formatWon,
  getInderiumAmountFromKrw,
  INDERIUM_CHARGE_OPTIONS,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from '@/lib/billing'
import { useAuthStore } from '@/stores/auth'

type HybridBillingPanelProps = {
  isLoggedIn: boolean
  isSubscribed: boolean
  paidBalance: number
  freeBalance: number
  appEnvironment: 'development' | 'staging' | 'production'
  isMockSubscriptionEnabled: boolean
  isMockCoinChargeEnabled: boolean
}

type PendingAction =
  | { kind: 'subscription'; planId: SubscriptionPlanId }
  | { kind: 'cancel-subscription' }
  | { kind: 'charge'; amountKrw: number }
  | null

function getPendingKey(action: PendingAction) {
  if (!action) {
    return ''
  }

  if (action.kind === 'subscription') {
    return `subscription:${action.planId}`
  }

  if (action.kind === 'charge') {
    return `charge:${action.amountKrw}`
  }

  return action.kind
}

export function HybridBillingPanel({
  isLoggedIn,
  isSubscribed,
  paidBalance,
  freeBalance,
  appEnvironment,
  isMockSubscriptionEnabled,
  isMockCoinChargeEnabled,
}: HybridBillingPanelProps) {
  const router = useRouter()
  const { checkSession } = useAuthStore()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [message, setMessage] = useState('')
  const pendingKey = getPendingKey(pendingAction)

  async function refreshAuthState() {
    await checkSession()
    router.refresh()
  }

  async function activateSubscription(planId: SubscriptionPlanId) {
    if (!isMockSubscriptionEnabled) {
      setMessage('테스트 구독은 staging 또는 로컬 개발 환경에서만 사용할 수 있습니다.')
      return
    }

    if (!isLoggedIn) {
      setMessage('로그인 후 구독을 시작할 수 있습니다.')
      return
    }

    setPendingAction({ kind: 'subscription', planId })
    setMessage('')

    try {
      const response = await fetch('/api/subscriptions/dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'activate', planId }),
      })
      const result = await response.json().catch(() => null) as { error?: string } | null

      if (!response.ok) {
        setMessage(result?.error ?? '구독 상태를 바꾸지 못했습니다.')
        return
      }

      setMessage('로컬 테스트용 구독이 활성화되었습니다.')
      await refreshAuthState()
    } finally {
      setPendingAction(null)
    }
  }

  async function cancelSubscription() {
    if (!isMockSubscriptionEnabled) {
      setMessage('테스트 구독은 staging 또는 로컬 개발 환경에서만 사용할 수 있습니다.')
      return
    }

    if (!isLoggedIn) {
      setMessage('로그인 후 구독 상태를 변경할 수 있습니다.')
      return
    }

    setPendingAction({ kind: 'cancel-subscription' })
    setMessage('')

    try {
      const response = await fetch('/api/subscriptions/dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      })
      const result = await response.json().catch(() => null) as { error?: string } | null

      if (!response.ok) {
        setMessage(result?.error ?? '구독을 해지하지 못했습니다.')
        return
      }

      setMessage('로컬 테스트용 구독이 해지되었습니다.')
      await refreshAuthState()
    } finally {
      setPendingAction(null)
    }
  }

  async function chargeInderium(amountKrw: number) {
    if (!isMockCoinChargeEnabled) {
      setMessage('테스트 인더륨 충전은 staging 또는 로컬 개발 환경에서만 사용할 수 있습니다.')
      return
    }

    if (!isLoggedIn) {
      setMessage('로그인 후 인더륨을 충전할 수 있습니다.')
      return
    }

    const amount = getInderiumAmountFromKrw(amountKrw)

    setPendingAction({ kind: 'charge', amountKrw })
    setMessage('')

    try {
      const response = await fetch('/api/coins/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentProvider: appEnvironment === 'staging' ? 'staging-mock' : 'local-dev',
          idempotencyKey: `${appEnvironment}-mock-${crypto.randomUUID()}`,
        }),
      })
      const result = await response.json().catch(() => null) as { error?: string } | null

      if (!response.ok) {
        setMessage(
          result?.error === 'Coin charge is disabled until server-side payment verification is implemented.'
            ? '테스트 충전을 쓰려면 staging mock billing 또는 로컬 충전 플래그가 필요합니다.'
            : result?.error ?? '인더륨 충전을 완료하지 못했습니다.'
        )
        return
      }

      setMessage(`${formatInderium(amount)} 충전이 로컬 장부에 반영되었습니다.`)
      router.refresh()
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="grid gap-7">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Account Billing</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">내 이용 상태</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              구독은 기본 열람권, 인더륨은 소장·후원·개별 구매에 사용하는 보조 지갑입니다.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-300">
            <p>구독: <span className="font-semibold text-white">{isSubscribed ? '활성' : '미구독'}</span></p>
            <p>유료 인더륨: <span className="font-semibold text-white">{formatInderium(paidBalance)}</span></p>
            <p>무료 인더륨: <span className="font-semibold text-white">{formatInderium(freeBalance)}</span></p>
            <p>환경: <span className="font-semibold text-white">{appEnvironment}</span></p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-sky-300/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
          <p>구독 테스트: {isMockSubscriptionEnabled ? '사용 가능' : '비활성'}</p>
          <p>인더륨 테스트 충전: {isMockCoinChargeEnabled ? '사용 가능' : '비활성'}</p>
        </div>

        {message ? (
          <p className="mt-4 rounded-lg border border-sky-300/20 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">
            {message}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">구독 플랜</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            기본은 월 구독입니다. 선공개, 소장, 후원은 인더륨을 따로 사용합니다.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const actionKey = `subscription:${plan.id}`
            const periodLabel = plan.billingPeriod === 'annual' ? '연' : '월'

            return (
              <article
                key={plan.id}
                className={`rounded-lg border p-5 ${
                  plan.recommended
                    ? 'border-emerald-300/30 bg-emerald-500/10'
                    : 'border-white/10 bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{plan.name}</p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {formatWon(plan.priceKrw)}
                      <span className="ml-1 text-sm font-semibold text-zinc-400">/{periodLabel}</span>
                    </p>
                  </div>
                  {plan.recommended ? (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                      기본 추천
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 min-h-12 text-sm leading-6 text-zinc-400">{plan.description}</p>
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-zinc-300">
                  {plan.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => activateSubscription(plan.id)}
                  disabled={Boolean(pendingAction) || !isMockSubscriptionEnabled}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingKey === actionKey
                    ? '적용 중...'
                    : !isMockSubscriptionEnabled
                      ? '테스트 비활성'
                      : isSubscribed
                        ? '플랜 변경 테스트'
                        : '구독 시작 테스트'}
                </button>
              </article>
            )
          })}
        </div>

        {isSubscribed ? (
          <button
            type="button"
            onClick={cancelSubscription}
            disabled={Boolean(pendingAction) || !isMockSubscriptionEnabled}
            className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingKey === 'cancel-subscription' ? '해지 중...' : '로컬 구독 해지'}
          </button>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">인더륨 충전</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            인더륨은 구독을 대체하지 않고, 개별 회차 소장과 작가 후원에 사용합니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {INDERIUM_CHARGE_OPTIONS.map((option) => {
            const amount = getInderiumAmountFromKrw(option.amountKrw)
            const actionKey = `charge:${option.amountKrw}`

            return (
              <article key={option.amountKrw} className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
                <p className="text-sm font-semibold text-zinc-300">{option.label}</p>
                <h3 className="mt-3 text-3xl font-black text-white">{formatWon(option.amountKrw)}</h3>
                <p className="mt-2 text-lg font-bold text-amber-100">{formatInderium(amount)}</p>
                <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-400">{option.note}</p>
                <button
                  type="button"
                  onClick={() => chargeInderium(option.amountKrw)}
                  disabled={Boolean(pendingAction) || !isMockCoinChargeEnabled}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-amber-300/30 bg-amber-500/15 px-4 text-sm font-semibold text-amber-50 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingKey === actionKey ? '충전 중...' : isMockCoinChargeEnabled ? '테스트 충전' : '테스트 비활성'}
                </button>
              </article>
            )
          })}
        </div>

        {!isLoggedIn ? (
          <Link
            href="/join-prompt?next=%2Fmain%2Fstore"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            로그인하고 테스트하기
          </Link>
        ) : null}
      </section>
    </div>
  )
}
