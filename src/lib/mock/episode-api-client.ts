'use client'

import type { ArtworkEpisode } from '@/lib/mock/explore-data'
import {
  getEpisodeReference,
} from '@/lib/mock/episode-backend-link'
import {
  purchaseEpisodeLocally,
  startWaitFreeLocally,
  unlockEpisodeLocally,
} from '@/lib/mock/episode-access-client'

interface EpisodeActionInput {
  scope: string
  userId?: string | null
  artworkId: string
  episode: ArtworkEpisode
}

export interface EpisodeActionResult {
  ok: boolean
  message: string
  mode: 'server' | 'local'
}

async function readResponseMessage(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: string
      message?: string
      available_at?: string
    }

    return payload
  } catch {
    return {}
  }
}

function formatAvailableAt(value?: string) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function canUseServerAction(userId: string | null | undefined, episode: ArtworkEpisode) {
  const reference = getEpisodeReference(episode)

  return Boolean(
    userId &&
      (reference.backendEpisodeId ||
        (reference.backendChannelId && typeof reference.episodeNumber === 'number'))
  )
}

export async function tryPurchaseEpisode({
  scope,
  userId,
  artworkId,
  episode,
}: EpisodeActionInput): Promise<EpisodeActionResult> {
  const reference = getEpisodeReference(episode)

  if (!canUseServerAction(userId, episode)) {
    purchaseEpisodeLocally(scope, artworkId, episode.id)
    return {
      ok: true,
      message: userId
        ? '서버 매핑이 아직 없어 프로토타입 구매로 반영했습니다.'
        : '로그인 전 단계라 프로토타입 구매로 반영했습니다.',
      mode: 'local',
    }
  }

  const response = await fetch('/api/coins/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      episodeId: reference.backendEpisodeId,
      channelId: reference.backendChannelId,
      episodeNumber: reference.episodeNumber,
    }),
  })

  if (response.ok) {
    purchaseEpisodeLocally(scope, artworkId, episode.id)
    return {
      ok: true,
      message: '구매가 서버에 반영되었습니다.',
      mode: 'server',
    }
  }

  const payload = await readResponseMessage(response)

  if (response.status === 401) {
    return { ok: false, message: '로그인 상태를 다시 확인해 주세요.', mode: 'server' }
  }

  if (response.status === 402) {
    return { ok: false, message: '코인이 부족합니다. 충전 후 다시 시도해 주세요.', mode: 'server' }
  }

  if (response.status === 404) {
    return { ok: false, message: '서버에서 회차 정보를 찾지 못했습니다.', mode: 'server' }
  }

  return {
    ok: false,
    message: payload.error ?? payload.message ?? '구매 처리 중 문제가 발생했습니다.',
    mode: 'server',
  }
}

export async function tryWaitFreeUnlock({
  scope,
  userId,
  artworkId,
  episode,
}: EpisodeActionInput): Promise<EpisodeActionResult> {
  const reference = getEpisodeReference(episode)

  if (!canUseServerAction(userId, episode)) {
    startWaitFreeLocally(scope, artworkId, episode.id)
    return {
      ok: true,
      message: userId
        ? '서버 매핑이 아직 없어 프로토타입 대기로 시작했습니다.'
        : '로그인 전 단계라 프로토타입 대기로 시작했습니다.',
      mode: 'local',
    }
  }

  const response = await fetch('/api/coins/wait-free', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      episodeId: reference.backendEpisodeId,
      channelId: reference.backendChannelId,
      episodeNumber: reference.episodeNumber,
    }),
  })

  if (response.ok) {
    unlockEpisodeLocally(scope, artworkId, episode.id)
    return {
      ok: true,
      message: '서버 기준으로 무료 해금이 반영되었습니다.',
      mode: 'server',
    }
  }

  const payload = await readResponseMessage(response)

  if (response.status === 401) {
    return { ok: false, message: '로그인 상태를 다시 확인해 주세요.', mode: 'server' }
  }

  if (response.status === 403) {
    const availableAt = formatAvailableAt(payload.available_at)

    return {
      ok: false,
      message: availableAt
        ? `${availableAt} 이후에 다시 무료 해금할 수 있습니다.`
        : '아직 무료 해금 가능 시간이 아닙니다.',
      mode: 'server',
    }
  }

  if (response.status === 404) {
    return { ok: false, message: '서버에서 회차 정보를 찾지 못했습니다.', mode: 'server' }
  }

  return {
    ok: false,
    message: payload.error ?? payload.message ?? '무료 해금 처리 중 문제가 발생했습니다.',
    mode: 'server',
  }
}
