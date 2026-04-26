'use client'

import type { ArtworkEpisode, EpisodeAccessState } from '@/lib/mock/explore-data'
import { getScopedStorageKey } from '@/lib/mock/user-scope-client'

const PURCHASED_KEY = 'inderverse-purchased-episodes'
const UNLOCKED_KEY = 'inderverse-unlocked-episodes'
const WAIT_FREE_KEY = 'inderverse-wait-free-starts'
const UPDATE_EVENT = 'inderverse-episode-access-updated'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT))
}

function getEpisodeKey(artworkId: string, episodeId: string) {
  return `${artworkId}:${episodeId}`
}

export function subscribeEpisodeAccess(listener: () => void) {
  window.addEventListener(UPDATE_EVENT, listener)
  return () => window.removeEventListener(UPDATE_EVENT, listener)
}

export function purchaseEpisodeLocally(scope: string, artworkId: string, episodeId: string) {
  const ids = readJson<string[]>(getScopedStorageKey(PURCHASED_KEY, scope), [])
  const key = getEpisodeKey(artworkId, episodeId)

  if (!ids.includes(key)) {
    writeJson(getScopedStorageKey(PURCHASED_KEY, scope), [...ids, key])
  }
}

export function unlockEpisodeLocally(scope: string, artworkId: string, episodeId: string) {
  const ids = readJson<string[]>(getScopedStorageKey(UNLOCKED_KEY, scope), [])
  const key = getEpisodeKey(artworkId, episodeId)

  if (!ids.includes(key)) {
    writeJson(getScopedStorageKey(UNLOCKED_KEY, scope), [...ids, key])
  }
}

export function startWaitFreeLocally(scope: string, artworkId: string, episodeId: string) {
  const starts = readJson<Record<string, number>>(getScopedStorageKey(WAIT_FREE_KEY, scope), {})
  const key = getEpisodeKey(artworkId, episodeId)

  if (!starts[key]) {
    writeJson(getScopedStorageKey(WAIT_FREE_KEY, scope), { ...starts, [key]: Date.now() })
  }
}

export function getWaitFreeStartedAt(scope: string, artworkId: string, episodeId: string) {
  const starts = readJson<Record<string, number>>(getScopedStorageKey(WAIT_FREE_KEY, scope), {})
  return starts[getEpisodeKey(artworkId, episodeId)] ?? null
}

export function getEffectiveEpisodeAccess(
  scope: string,
  artworkId: string,
  episode: ArtworkEpisode
): { accessState: EpisodeAccessState; remainingSeconds: number | null; startedAt: number | null } {
  const key = getEpisodeKey(artworkId, episode.id)
  const purchasedIds = readJson<string[]>(getScopedStorageKey(PURCHASED_KEY, scope), [])
  const unlockedIds = readJson<string[]>(getScopedStorageKey(UNLOCKED_KEY, scope), [])

  if (purchasedIds.includes(key) || episode.accessState === 'purchased') {
    return { accessState: 'purchased', remainingSeconds: null, startedAt: null }
  }

  if (unlockedIds.includes(key)) {
    return { accessState: 'free', remainingSeconds: null, startedAt: null }
  }

  if (episode.accessState !== 'wait_free') {
    return { accessState: episode.accessState, remainingSeconds: null, startedAt: null }
  }

  const startedAt = getWaitFreeStartedAt(scope, artworkId, episode.id)

  if (!startedAt || !episode.waitFreeHours) {
    return { accessState: 'wait_free', remainingSeconds: episode.waitFreeHours ? Math.floor(episode.waitFreeHours * 3600) : null, startedAt }
  }

  const totalSeconds = Math.floor(episode.waitFreeHours * 3600)
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)

  if (remainingSeconds === 0) {
    return { accessState: 'free', remainingSeconds: 0, startedAt }
  }

  return { accessState: 'wait_free', remainingSeconds, startedAt }
}
