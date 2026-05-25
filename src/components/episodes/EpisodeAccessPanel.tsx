'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useReducer, useState } from 'react'
import type { ArtworkEpisode } from '@/lib/explore'
import { formatInderium } from '@/lib/billing'
import { useAuthStore } from '@/stores/auth'
import {
  getEffectiveEpisodeAccess,
  unlockEpisodeLocally,
  subscribeEpisodeAccess,
} from '@/lib/mock/episode-access-client'
import { LOGIN_REQUIRED_MESSAGE } from '@/lib/guest-policy'
import { getUserScope } from '@/lib/mock/user-scope-client'

export function EpisodeAccessPanel({
  artworkId,
  episode,
}: {
  artworkId: string
  episode: ArtworkEpisode
}) {
  const router = useRouter()
  const [, forceRender] = useReducer((value: number) => value + 1, 0)
  const [isPending, setIsPending] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const { user, isSubscribed, checkSession } = useAuthStore()
  const scope = getUserScope(user?.id)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    return subscribeEpisodeAccess(forceRender)
  }, [])

  function handleSubscribePrompt() {
    if (!user) {
      setActionMessage(LOGIN_REQUIRED_MESSAGE)
      return
    }

    setIsPending(true)
    window.setTimeout(() => {
      setActionMessage('구독 결제 연결 전까지는 스토어에서 구독 안내를 확인할 수 있습니다.')
      setIsPending(false)
    }, 250)
  }

  function handleLocalSubscriberPreview() {
    unlockEpisodeLocally(scope, artworkId, episode.id)
    setActionMessage('구독자 접근권한으로 회차를 열었습니다.')
  }

  async function handleInderiumPurchase() {
    if (!user) {
      setActionMessage(LOGIN_REQUIRED_MESSAGE)
      return
    }

    if (!episode.backendEpisodeId) {
      setActionMessage('이 회차는 아직 인더륨 구매 장부와 연결되지 않았습니다.')
      return
    }

    setIsPending(true)
    setActionMessage(null)

    try {
      const response = await fetch('/api/coins/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ episodeId: episode.backendEpisodeId }),
      })
      const result = await response.json().catch(() => null) as { error?: string; message?: string } | null

      if (!response.ok) {
        if (result?.error === 'Insufficient balance') {
          setActionMessage('인더륨 잔액이 부족합니다. 스토어에서 로컬 충전 후 다시 시도해 주세요.')
          return
        }

        setActionMessage(result?.error ?? '인더륨 구매를 완료하지 못했습니다.')
        return
      }

      unlockEpisodeLocally(scope, artworkId, episode.id)
      setActionMessage(
        result?.message === 'Already purchased'
          ? '이미 소장한 회차입니다.'
          : '인더륨으로 회차를 소장했습니다.'
      )
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  const effective = getEffectiveEpisodeAccess(scope, artworkId, episode)
  const canRead = effective.accessState === 'free' || (effective.accessState === 'locked' && isSubscribed)
  const isNovel = episode.workType === 'novel'

  if (canRead) {
    return (
      <article className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        {effective.accessState === 'locked' && isSubscribed ? (
          <div className="mb-5 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-100">
            구독자 공개
          </div>
        ) : null}
        {isNovel ? (
          <div className="mx-auto max-w-3xl space-y-7 font-serif text-[17px] leading-9 text-zinc-100 md:text-xl md:leading-10">
            {episode.body.length > 0 ? (
              episode.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))
            ) : (
              <p className="text-zinc-400">아직 공개 본문이 준비되지 않았습니다.</p>
            )}
          </div>
        ) : episode.imageUrls && episode.imageUrls.length > 0 ? (
          <div className="grid gap-4">
            {episode.body.length > 0 ? (
              <div className="space-y-4 text-sm leading-7 text-zinc-300 md:text-base">
                {episode.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {episode.imageUrls.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index + 1}`}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20"
              >
                <Image
                  src={imageUrl}
                  alt={`${episode.title} 이미지 ${index + 1}`}
                  width={1600}
                  height={2400}
                  sizes="100vw"
                  className="h-auto w-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 text-[15px] leading-8 text-zinc-200 md:text-lg md:leading-9">
            {episode.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
      </article>
    )
  }

  if (effective.accessState === 'locked') {
    return (
      <section className="rounded-[32px] border border-amber-400/15 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">Episode Locked</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">이 회차는 구독자 공개입니다</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
          작가가 정한 맛보기 구간을 지난 회차입니다. 구독자는 바로 읽을 수 있고, 원할 때는 인더륨으로 개별 소장할 수 있습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSubscribePrompt}
            disabled={isPending}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {isPending ? '확인 중...' : user ? '구독하고 이어보기' : '로그인하고 구독하기'}
          </button>
          <Link href="/main/store" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10">
            구독 안내 보기
          </Link>
          {episode.backendEpisodeId && episode.coinPrice && episode.coinPrice > 0 ? (
            <button
              type="button"
              onClick={handleInderiumPurchase}
              disabled={isPending}
              className="rounded-full border border-amber-300/25 bg-amber-500/15 px-5 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? '처리 중...' : `${formatInderium(episode.coinPrice)}으로 소장`}
            </button>
          ) : null}
          {isSubscribed ? (
            <button
              type="button"
              onClick={handleLocalSubscriberPreview}
              className="rounded-full border border-violet-400/20 bg-violet-500/10 px-5 py-3 text-sm text-violet-100 transition hover:bg-violet-500/15"
            >
              구독자 권한으로 열기
            </button>
          ) : null}
        </div>
        {actionMessage ? <p className="mt-4 text-sm leading-6 text-zinc-400">{actionMessage}</p> : null}
      </section>
    )
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Coming Soon</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight">이 회차는 아직 준비 중입니다</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
        공개 전 회차를 표시하기 위한 자리입니다. 나중에는 예약 공개 시간이나 알림 신청 흐름을 여기에 붙일 수 있습니다.
      </p>
    </section>
  )
}
