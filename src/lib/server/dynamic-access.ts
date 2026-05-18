import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type DynamicAccessReason =
  | 'free_archive'
  | 'teaser'
  | 'subscriber'
  | 'subscription_required'
  | 'not_published'
  | 'episode_not_found'
  | 'work_not_found'
  | 'unknown'

export type DynamicAccessDecision = {
  allowed: boolean
  reason: DynamicAccessReason
  episodeNumber: number | null
  maxFreeEpisode: number | null
  triggerSubscriptionPrompt: boolean
}

function readBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : false
}

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readReason(value: unknown): DynamicAccessReason {
  return typeof value === 'string' ? (value as DynamicAccessReason) : 'unknown'
}

export async function checkEpisodeDynamicAccess({
  channelId,
  episodeId,
}: {
  channelId: string
  episodeId: string
}): Promise<DynamicAccessDecision> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase.rpc('check_dynamic_access', {
    p_user_id: user?.id ?? null,
    p_webtoon_id: channelId,
    p_episode_id: episodeId,
  })

  if (error) {
    throw new Error(error.message || '회차 접근 권한을 확인하지 못했습니다.')
  }

  const payload = data && typeof data === 'object' && !Array.isArray(data)
    ? data as Record<string, unknown>
    : {}

  return {
    allowed: readBoolean(payload.allowed),
    reason: readReason(payload.reason),
    episodeNumber: readNumber(payload.episodeNumber),
    maxFreeEpisode: readNumber(payload.maxFreeEpisode),
    triggerSubscriptionPrompt: readBoolean(payload.triggerSubscriptionPrompt),
  }
}
