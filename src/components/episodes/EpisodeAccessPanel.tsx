'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useReducer, useState } from 'react'
import { ProtectedEpisodeImage, ProtectedReaderSurface } from '@/components/content/ProtectedReaderSurface'
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
  isShortForm = false,
}: {
  artworkId: string
  episode: ArtworkEpisode
  isShortForm?: boolean
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
    setActionMessage(isShortForm ? '구독자 접근권한으로 작품을 열었습니다.' : '구독자 접근권한으로 회차를 열었습니다.')
  }

  async function handleInderiumPurchase() {
    if (!user) {
      setActionMessage(LOGIN_REQUIRED_MESSAGE)
      return
    }

    if (!episode.backendEpisodeId) {
      setActionMessage(
        isShortForm
          ? '이 작품은 아직 인더륨 구매 장부와 연결되지 않았습니다.'
          : '이 회차는 아직 인더륨 구매 장부와 연결되지 않았습니다.'
      )
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
          ? isShortForm
            ? '이미 소장한 작품입니다.'
            : '이미 소장한 회차입니다.'
          : isShortForm
            ? '인더륨으로 작품을 소장했습니다.'
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
  const lockedEyebrow = isShortForm ? 'Work Locked' : 'Episode Locked'
  const lockedTitle = isShortForm ? '이 작품은 구독자 공개입니다' : '이 회차는 구독자 공개입니다'
  const lockedDescription = isShortForm
    ? '작가가 정한 공개 범위의 단편 작품입니다. 구독자는 바로 볼 수 있고, 원할 때는 인더륨으로 개별 소장할 수 있습니다.'
    : '작가가 정한 맛보기 구간을 지난 회차입니다. 구독자는 바로 읽을 수 있고, 원할 때는 인더륨으로 개별 소장할 수 있습니다.'
  const comingSoonTitle = isShortForm ? '이 작품은 아직 준비 중입니다' : '이 회차는 아직 준비 중입니다'
  const comingSoonDescription = isShortForm
    ? '공개 전 작품을 표시하기 위한 자리입니다. 나중에는 예약 공개 시간이나 알림 신청 흐름을 여기에 붙일 수 있습니다.'
    : '공개 전 회차를 표시하기 위한 자리입니다. 나중에는 예약 공개 시간이나 알림 신청 흐름을 여기에 붙일 수 있습니다.'

  if (canRead) {
    return (
      <ProtectedReaderSurface
        artworkId={artworkId}
        episodeId={episode.id}
        viewerId={user?.id}
        className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8"
      >
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
              <ProtectedEpisodeImage
                key={`${imageUrl}-${index + 1}`}
                artworkId={artworkId}
                episodeId={episode.id}
                imageUrl={imageUrl}
                index={index}
                title={episode.title}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6 text-[15px] leading-8 text-zinc-200 md:text-lg md:leading-9">
            {episode.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
      </ProtectedReaderSurface>
    )
  }

  if (effective.accessState === 'locked') {
    return (
      <section className="rounded-[32px] border border-amber-400/15 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">{lockedEyebrow}</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">{lockedTitle}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
          {lockedDescription}
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
      <h2 className="mt-3 text-3xl font-black tracking-tight">{comingSoonTitle}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
        {comingSoonDescription}
      </p>
    </section>
  )
}
