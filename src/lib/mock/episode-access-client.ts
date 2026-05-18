'use client'

import type { ArtworkEpisode, EpisodeAccessState } from '@/lib/explore'
import { getScopedStorageKey } from '@/lib/mock/user-scope-client'

const UNLOCKED_KEY = 'inderverse-unlocked-episodes'
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

export function unlockEpisodeLocally(scope: string, artworkId: string, episodeId: string) {
  const ids = readJson<string[]>(getScopedStorageKey(UNLOCKED_KEY, scope), [])
  const key = getEpisodeKey(artworkId, episodeId)

  if (!ids.includes(key)) {
    writeJson(getScopedStorageKey(UNLOCKED_KEY, scope), [...ids, key])
  }
}

export function getEffectiveEpisodeAccess(
  scope: string,
  artworkId: string,
  episode: ArtworkEpisode
): { accessState: EpisodeAccessState } {
  const key = getEpisodeKey(artworkId, episode.id)
  const unlockedIds = readJson<string[]>(getScopedStorageKey(UNLOCKED_KEY, scope), [])

  if (unlockedIds.includes(key)) {
    return { accessState: 'free' }
  }

  return { accessState: episode.accessState }
}
