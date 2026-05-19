import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { isPrimaryBottegaWorkType } from '@/lib/bottega'
import type { CreatorChannelExternalLink, CreatorChannelRecord, WorkType } from '@/lib/work'
import type { Json } from '@/lib/supabase/types'

function buildDefaultCreatorSlug(userId: string) {
  return `creator-${userId.replaceAll('-', '').slice(0, 12)}`
}

function isMissingPrimaryWorkTypeColumnError(error: { message?: string; details?: string | null; code?: string } | null) {
  const message = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase()
  return message.includes('primary_work_type')
}

function mapCreatorChannelRow(row: {
  id: string
  owner_id: string
  slug: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  cover_image_url: string | null
  primary_work_type: WorkType | null
  external_links: Json
  status: string
}): CreatorChannelRecord {
  const primaryWorkType = row.primary_work_type && isPrimaryBottegaWorkType(row.primary_work_type)
    ? row.primary_work_type
    : null

  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    coverImageUrl: row.cover_image_url,
    primaryWorkType,
    externalLinks: parseCreatorChannelExternalLinks(row.external_links),
    status:
      row.status === 'draft' || row.status === 'suspended'
        ? row.status
        : 'active',
  }
}

export function parseCreatorChannelExternalLinks(value: Json): CreatorChannelExternalLink[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null
      }

      const link = entry as Record<string, Json | undefined>
      const label = typeof link.label === 'string' ? link.label.trim() : ''
      const url = typeof link.url === 'string' ? link.url.trim() : ''

      if (!label || !url) {
        return null
      }

      return { label, url }
    })
    .filter((entry): entry is CreatorChannelExternalLink => entry !== null)
    .slice(0, 5)
}

export async function getCreatorChannelByOwnerId(ownerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('creator_channels')
    .select('id, owner_id, slug, display_name, bio, avatar_url, cover_image_url, primary_work_type, external_links, status')
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (error) {
    if (isMissingPrimaryWorkTypeColumnError(error)) {
      const fallback = await supabase
        .from('creator_channels')
        .select('id, owner_id, slug, display_name, bio, avatar_url, cover_image_url, external_links, status')
        .eq('owner_id', ownerId)
        .maybeSingle()

      if (fallback.error) {
        throw new Error(`Failed to load creator channel: ${fallback.error.message}`)
      }

      return fallback.data ? mapCreatorChannelRow({ ...fallback.data, primary_work_type: null }) : null
    }

    throw new Error(`Failed to load creator channel: ${error.message}`)
  }

  return data ? mapCreatorChannelRow(data) : null
}

export async function ensureDefaultCreatorChannel(ownerId: string) {
  const existing = await getCreatorChannelByOwnerId(ownerId)

  if (existing) {
    return existing
  }

  const supabase = await createClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', ownerId)
    .single()

  if (profileError) {
    throw new Error(`Failed to load creator profile: ${profileError.message}`)
  }

  const { data, error } = await supabase
    .from('creator_channels')
    .insert({
      owner_id: ownerId,
      slug: buildDefaultCreatorSlug(ownerId),
      display_name: profile?.display_name?.trim() || '작가',
      avatar_url: profile?.avatar_url ?? null,
      status: 'active',
    })
    .select('id, owner_id, slug, display_name, bio, avatar_url, cover_image_url, primary_work_type, external_links, status')
    .single()

  if (error) {
    if (isMissingPrimaryWorkTypeColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('creator_channels')
        .insert({
          owner_id: ownerId,
          slug: buildDefaultCreatorSlug(ownerId),
          display_name: profile?.display_name?.trim() || '작가',
          avatar_url: profile?.avatar_url ?? null,
          status: 'active',
        })
        .select('id, owner_id, slug, display_name, bio, avatar_url, cover_image_url, external_links, status')
        .single()

      if (!fallbackError && fallbackData) {
        return mapCreatorChannelRow({ ...fallbackData, primary_work_type: null })
      }

      const fallback = await getCreatorChannelByOwnerId(ownerId)

      if (fallback) {
        return fallback
      }

      if (fallbackError && fallbackError.code !== '23505') {
        throw new Error(fallbackError.message || '작가 채널을 만들지 못했습니다.')
      }
    }

    if (error.code === '23505') {
      throw new Error('이미 사용 중인 작가 채널 주소입니다. 잠시 후 다시 시도해 주세요.')
    }

    throw new Error(error.message || '작가 채널을 만들지 못했습니다.')
  }

  if (!data) {
    throw new Error('작가 채널을 만들지 못했습니다.')
  }

  return mapCreatorChannelRow(data)
}
