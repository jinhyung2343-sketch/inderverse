import type { Json } from '@/lib/supabase/types'

export const WORK_DRAFT_TYPES = ['webtoon_channel', 'webtoon_episode'] as const

export type WorkDraftType = (typeof WORK_DRAFT_TYPES)[number]

export interface WorkDraftRecord<TPayload extends Json = Json> {
  draftKey: string
  draftType: WorkDraftType
  payload: TPayload
  updatedAt: string
}

export function isWorkDraftType(value: unknown): value is WorkDraftType {
  return typeof value === 'string' && WORK_DRAFT_TYPES.includes(value as WorkDraftType)
}

export function isValidWorkDraftKey(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 160
}

export function getWebtoonChannelDraftKey(channelId?: string) {
  return `webtoon-channel:${channelId ?? 'new'}`
}

export function getWebtoonChannelDraftStorageKey(channelId?: string) {
  return `inderverse:webtoon-channel-draft:${channelId ?? 'new'}`
}

export function getWebtoonChannelDraftResetSignalKey(channelId?: string) {
  return `inderverse:webtoon-channel-draft-reset:${channelId ?? 'new'}`
}

export function getWebtoonEpisodeDraftKey(channelId: string, episodeId?: string) {
  return `webtoon-episode:${channelId}:${episodeId ?? 'new'}`
}

export function isJsonObject(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function toJsonCompatible(value: unknown): Json {
  if (value === null) {
    return null
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonCompatible(entry))
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, toJsonCompatible(entry)])
    )
  }

  return null
}
