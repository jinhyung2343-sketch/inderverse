import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { CreatorChannelExternalLink, CreatorChannelRecord } from '@/lib/work'
import type { Json } from '@/lib/supabase/types'

function buildDefaultCreatorSlug(userId: string) {
  return `creator-${userId.replaceAll('-', '').slice(0, 12)}`
}

function mapCreatorChannelRow(row: {
  id: string
  owner_id: string
  slug: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  cover_image_url: string | null
  external_links: Json
  status: string
}): CreatorChannelRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    coverImageUrl: row.cover_image_url,
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
    .select('id, owner_id, slug, display_name, bio, avatar_url, cover_image_url, external_links, status')
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (error) {
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
    .select('id, owner_id, slug, display_name, bio, avatar_url, cover_image_url, external_links, status')
    .single()

  if (error || !data) {
    throw new Error(error?.message || '작가 채널을 만들지 못했습니다.')
  }

  return mapCreatorChannelRow(data)
}
