'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ArtworkEpisode } from '@/lib/mock/explore-data'
import { useAuthStore } from '@/stores/auth'
import {
  getEffectiveEpisodeAccess,
  subscribeEpisodeAccess,
} from '@/lib/mock/episode-access-client'
import { WaitFreeCountdown } from '@/components/episodes/WaitFreeCountdown'
import { getUserScope } from '@/lib/mock/user-scope-client'
import { hasServerEpisodeLink } from '@/lib/mock/episode-backend-link'
import { tryPurchaseEpisode, tryWaitFreeUnlock } from '@/lib/mock/episode-api-client'

const badgeClassByAccess = {
  free: 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  locked: 'border border-amber-400/20 bg-amber-500/10 text-amber-100',
  wait_free: 'border border-sky-400/20 bg-sky-500/10 text-sky-100',
  purchased: 'border border-violet-400/20 bg-violet-500/10 text-violet-100',
  coming_soon: 'border border-white/10 bg-white/5 text-zinc-400',
} as const

export function ArtworkEpisodeList({
  artworkId,
  episodes,
}: {
  artworkId: string
  episodes: ArtworkEpisode[]
}) {
  const [, forceRender] = useState(0)
  const [pendingEpisodeId, setPendingEpisodeId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ episodeId: string; message: string } | null>(null)
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

  async function handlePurchase(episode: ArtworkEpisode) {
    setPendingEpisodeId(episode.id)

    try {
      const result = await tryPurchaseEpisode({
        scope,
        userId: user?.id,
        artworkId,
        episode,
      })

      setFeedback({ episodeId: episode.id, message: result.message })
    } finally {
      setPendingEpisodeId(null)
    }
  }

  async function handleWaitFree(episode: ArtworkEpisode) {
    setPendingEpisodeId(episode.id)

    try {
      const result = await tryWaitFreeUnlock({
        scope,
        userId: user?.id,
        artworkId,
        episode,
      })

      setFeedback({ episodeId: episode.id, message: result.message })
    } finally {
      setPendingEpisodeId(null)
    }
  }

  return (
    <div className="mt-6 grid gap-3">
      {episodes.map((episode, index) => {
        const effective = getEffectiveEpisodeAccess(scope, artworkId, episode)
        const href = `/main/explore/${artworkId}/episodes/${episode.id}`
        const canEnter = effective.accessState === 'free' || effective.accessState === 'purchased'

        if (canEnter) {
          return (
            <Link
              key={episode.id}
              href={href}
              className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 transition hover:bg-white/8"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Episode {index + 1}</p>
                <h3 className="mt-2 text-base font-semibold text-white">{episode.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{episode.preview}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] ${
                      hasServerEpisodeLink(episode)
                        ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
                        : 'border border-white/10 bg-white/5 text-zinc-400'
                    }`}
                  >
                    {hasServerEpisodeLink(episode) ? '서버 연동 준비' : '프로토타입 연동'}
                  </span>
                </div>
              </div>
                <span className={`rounded-full px-3 py-1 text-xs ${badgeClassByAccess[effective.accessState]}`}>
                  {effective.accessState === 'purchased' ? '구매됨' : '무료'}
                </span>
              </div>
            </Link>
          )
        }

        return (
          <article
            key={episode.id}
            className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 opacity-90"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Episode {index + 1}</p>
                <h3 className="mt-2 text-base font-semibold text-white">{episode.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{episode.preview}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] ${
                      hasServerEpisodeLink(episode)
                        ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
                        : 'border border-white/10 bg-white/5 text-zinc-400'
                    }`}
                  >
                    {hasServerEpisodeLink(episode) ? '서버 연동 준비' : '프로토타입 연동'}
                  </span>
                </div>
                {effective.accessState === 'wait_free' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-100">
                      <WaitFreeCountdown hours={episode.waitFreeHours ?? 0} prefix="무료 해금까지" />
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleWaitFree(episode)}
                      disabled={pendingEpisodeId === episode.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition hover:bg-white/10"
                    >
                      {pendingEpisodeId === episode.id ? '처리 중...' : '대기 시작'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePurchase(episode)}
                      disabled={pendingEpisodeId === episode.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition hover:bg-white/10"
                    >
                      {pendingEpisodeId === episode.id ? '처리 중...' : '바로 구매'}
                    </button>
                  </div>
                ) : null}
                {effective.accessState === 'locked' ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => void handlePurchase(episode)}
                      disabled={pendingEpisodeId === episode.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition hover:bg-white/10"
                    >
                      {pendingEpisodeId === episode.id ? '처리 중...' : '코인으로 해금'}
                    </button>
                  </div>
                ) : null}
                {feedback?.episodeId === episode.id ? (
                  <p className="mt-3 text-xs leading-5 text-zinc-400">{feedback.message}</p>
                ) : null}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${badgeClassByAccess[effective.accessState]}`}>
                {effective.accessState === 'wait_free'
                  ? '기다리면 무료'
                  : effective.accessState === 'locked'
                    ? '잠금'
                    : '준비중'}
              </span>
            </div>
          </article>
        )
      })}
    </div>
  )
}
