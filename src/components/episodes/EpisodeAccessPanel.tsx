'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ArtworkEpisode } from '@/lib/explore'
import { useAuthStore } from '@/stores/auth'
import {
  getEffectiveEpisodeAccess,
  subscribeEpisodeAccess,
} from '@/lib/mock/episode-access-client'
import { WaitFreeCountdown } from '@/components/episodes/WaitFreeCountdown'
import { LOGIN_REQUIRED_MESSAGE } from '@/lib/guest-policy'
import { getUserScope } from '@/lib/mock/user-scope-client'
import { hasServerEpisodeLink } from '@/lib/mock/episode-backend-link'
import { tryPurchaseEpisode, tryWaitFreeUnlock } from '@/lib/mock/episode-api-client'

export function EpisodeAccessPanel({
  artworkId,
  episode,
}: {
  artworkId: string
  episode: ArtworkEpisode
}) {
  const [, forceRender] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const { user, checkSession } = useAuthStore()
  const scope = getUserScope(user?.id)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    const unsubscribe = subscribeEpisodeAccess(() => forceRender((value) => value + 1))
    const ticker = window.setInterval(() => forceRender((value) => value + 1), 1000)

    return () => {
      unsubscribe()
      window.clearInterval(ticker)
    }
  }, [])

  async function handlePurchase() {
    if (!user) {
      setActionMessage(LOGIN_REQUIRED_MESSAGE)
      return
    }

    setIsPending(true)

    try {
      const result = await tryPurchaseEpisode({
        scope,
        userId: user?.id,
        artworkId,
        episode,
      })

      setActionMessage(result.message)
    } finally {
      setIsPending(false)
    }
  }

  async function handleWaitFree() {
    if (!user) {
      setActionMessage(LOGIN_REQUIRED_MESSAGE)
      return
    }

    setIsPending(true)

    try {
      const result = await tryWaitFreeUnlock({
        scope,
        userId: user?.id,
        artworkId,
        episode,
      })

      setActionMessage(result.message)
    } finally {
      setIsPending(false)
    }
  }

  const effective = getEffectiveEpisodeAccess(scope, artworkId, episode)
  const canRead = effective.accessState === 'free' || effective.accessState === 'purchased'
  const isServerReady = hasServerEpisodeLink(episode)
  const isNovel = episode.workType === 'novel'

  if (canRead) {
    return (
      <article className={`rounded-[32px] border ${effective.accessState === 'purchased' ? 'border-violet-400/15' : 'border-white/10'} bg-white/5 p-6 backdrop-blur-xl md:p-8`}>
        {effective.accessState === 'purchased' ? (
          <div className="mb-5 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-100">
            구매 완료
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
                className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/20"
              >
                <Image
                  src={imageUrl}
                  alt={`${episode.title} 이미지 ${index + 1}`}
                  width={1200}
                  height={1800}
                  className="h-auto w-full object-cover"
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
        <h2 className="mt-3 text-3xl font-black tracking-tight">이 회차는 잠금 상태입니다</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
          지금은 프로토타입 단계라 실제 코인 차감 대신 로컬 해금으로 연결합니다. 이후 이 버튼은 서버 결제 API로 바로 교체할 수 있게 분리해두었습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handlePurchase()}
            disabled={isPending}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {isPending ? '처리 중...' : '코인으로 해금'}
          </button>
          <Link href="/main/store" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10">
            충전하기
          </Link>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          {isServerReady
            ? '이 회차는 서버 결제 API 연결 준비가 된 상태입니다.'
            : '이 회차는 아직 목업 매핑 단계라 프로토타입 흐름으로 동작합니다.'}
        </p>
        {actionMessage ? <p className="mt-4 text-sm leading-6 text-zinc-400">{actionMessage}</p> : null}
      </section>
    )
  }

  if (effective.accessState === 'wait_free') {
    return (
      <section className="rounded-[32px] border border-sky-400/15 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/80">Wait Free</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">이 회차는 기다리면 무료입니다</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
          기다리면 무료 흐름이 실제로 움직이도록 연결해두었습니다. 대기를 시작하면 카운트다운이 줄어들고, 종료되면 이 화면에서 바로 읽을 수 있게 바뀝니다.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-sm text-sky-100">
          <WaitFreeCountdown hours={episode.waitFreeHours ?? 0} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleWaitFree()}
            disabled={isPending}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            {isPending ? '처리 중...' : '대기 시작'}
          </button>
          <button
            type="button"
            onClick={() => void handlePurchase()}
            disabled={isPending}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {isPending ? '처리 중...' : '바로 구매하기'}
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          {isServerReady
            ? '이 회차는 서버 기준 기다리면 무료 해금까지 이어질 수 있습니다.'
            : '이 회차는 아직 목업 매핑 단계라 프로토타입 대기 흐름으로 동작합니다.'}
        </p>
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
