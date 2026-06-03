'use client'

import Link from 'next/link'
import { useEffect, useReducer, useState } from 'react'
import type { ArtworkEpisode } from '@/lib/explore'
import { useAuthStore } from '@/stores/auth'
import {
  getEffectiveEpisodeAccess,
  subscribeEpisodeAccess,
} from '@/lib/mock/episode-access-client'
import { getUserScope } from '@/lib/mock/user-scope-client'
import { hasServerEpisodeLink } from '@/lib/mock/episode-backend-link'

const badgeClassByAccess = {
  free: 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  locked: 'border border-amber-400/20 bg-amber-500/10 text-amber-100',
  coming_soon: 'border border-white/10 bg-white/5 text-zinc-400',
} as const

export function ArtworkEpisodeList({
  artworkId,
  episodes,
  isShortForm = false,
}: {
  artworkId: string
  episodes: ArtworkEpisode[]
  isShortForm?: boolean
}) {
  const [, forceRender] = useReducer((value: number) => value + 1, 0)
  const [pendingEpisodeId, setPendingEpisodeId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ episodeId: string; message: string } | null>(null)
  const { user, isSubscribed, checkSession } = useAuthStore()
  const scope = getUserScope(user?.id)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    return subscribeEpisodeAccess(forceRender)
  }, [])

  function handleSubscribePrompt(episode: ArtworkEpisode) {
    setPendingEpisodeId(episode.id)
    window.setTimeout(() => {
      setFeedback({
        episodeId: episode.id,
        message: user
          ? '구독 결제 연결 전까지는 스토어에서 구독 안내를 확인할 수 있습니다.'
          : isShortForm
            ? '로그인 후 구독하면 이 작품을 볼 수 있습니다.'
            : '로그인 후 구독하면 맛보기 이후 회차를 이어볼 수 있습니다.',
      })
      setPendingEpisodeId(null)
    }, 250)
  }

  return (
    <div className="mt-6 grid gap-3">
      {episodes.map((episode, index) => {
        const effective = getEffectiveEpisodeAccess(scope, artworkId, episode)
        const href = `/main/explore/${artworkId}/episodes/${episode.id}`
        const canEnter = effective.accessState === 'free' || (effective.accessState === 'locked' && isSubscribed)
        const itemEyebrow = isShortForm ? '본편' : `Episode ${index + 1}`

        if (canEnter) {
          return (
            <Link
              key={episode.id}
              href={href}
              className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 transition hover:bg-white/8"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{itemEyebrow}</p>
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
                  {effective.accessState === 'locked' && isSubscribed ? '구독 공개' : '무료'}
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
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{itemEyebrow}</p>
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
                {effective.accessState === 'locked' ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handleSubscribePrompt(episode)}
                      disabled={pendingEpisodeId === episode.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition hover:bg-white/10"
                    >
                      {pendingEpisodeId === episode.id ? '확인 중...' : user ? '구독하고 보기' : '로그인하고 구독'}
                    </button>
                    <Link
                      href={href}
                      className="ml-2 inline-flex rounded-full border border-amber-300/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-100 transition hover:bg-amber-500/15"
                    >
                      인더륨 소장 보기
                    </Link>
                  </div>
                ) : null}
                {feedback?.episodeId === episode.id ? (
                  <p className="mt-3 text-xs leading-5 text-zinc-400">{feedback.message}</p>
                ) : null}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${badgeClassByAccess[effective.accessState]}`}>
                {effective.accessState === 'locked'
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
