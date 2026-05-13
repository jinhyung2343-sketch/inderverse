import 'server-only'

import { parseCreatorChannelExternalLinks } from '@/lib/server/creator-channels'
import { getPublicArtworkList } from '@/lib/server/explore'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PublicCreatorChannelSummary } from '@/lib/public-creator'
import type { Json } from '@/lib/supabase/types'

type PublicCreatorChannelRow = {
  id: string
  owner_id: string
  slug: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  cover_image_url: string | null
  external_links: Json
  status: string
  updated_at: string
}

function mapCreatorChannelSummary(
  channel: PublicCreatorChannelRow,
  artworkCounts: Map<string, { total: number; webtoon: number; novel: number; latestTitle: string | null }>
): PublicCreatorChannelSummary {
  const counts = artworkCounts.get(channel.slug) ?? {
    total: 0,
    webtoon: 0,
    novel: 0,
    latestTitle: null,
  }

  return {
    id: channel.id,
    slug: channel.slug,
    displayName: channel.display_name,
    bio: channel.bio?.trim() || '',
    avatarUrl: channel.avatar_url,
    coverImageUrl: channel.cover_image_url,
    artworkCount: counts.total,
    webtoonCount: counts.webtoon,
    novelCount: counts.novel,
    latestArtworkTitle: counts.latestTitle,
  }
}

export async function getPublicCreatorChannelList() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('creator_channels')
    .select('id, owner_id, slug, display_name, bio, avatar_url, cover_image_url, external_links, status, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load public creator channels: ${error.message}`)
  }

  const channels = (data ?? []) as PublicCreatorChannelRow[]
  const artworks = await getPublicArtworkList()
  const artworkCounts = new Map<string, { total: number; webtoon: number; novel: number; latestTitle: string | null }>()

  artworks.forEach((artwork) => {
    if (!artwork.creatorSlug) {
      return
    }

    const current = artworkCounts.get(artwork.creatorSlug) ?? {
      total: 0,
      webtoon: 0,
      novel: 0,
      latestTitle: null,
    }

    current.total += 1

    if (artwork.workType === 'webtoon') {
      current.webtoon += 1
    }

    if (artwork.workType === 'novel') {
      current.novel += 1
    }

    if (!current.latestTitle) {
      current.latestTitle = artwork.title
    }

    artworkCounts.set(artwork.creatorSlug, current)
  })

  return channels
    .map((channel) => mapCreatorChannelSummary(channel, artworkCounts))
    .sort((left, right) => right.artworkCount - left.artworkCount)
}

export async function getPublicCreatorChannelPage(slug: string) {
  if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(slug)) {
    return null
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('creator_channels')
    .select('id, owner_id, slug, display_name, bio, avatar_url, cover_image_url, external_links, status, updated_at')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load public creator channel: ${error.message}`)
  }

  if (!data) {
    return null
  }

  const channel = data as PublicCreatorChannelRow
  const artworks = await getPublicArtworkList()
  const creatorArtworks = artworks.filter((artwork) => artwork.creatorSlug === channel.slug)

  return {
    channel: {
      id: channel.id,
      ownerId: channel.owner_id,
      slug: channel.slug,
      displayName: channel.display_name,
      bio: channel.bio?.trim() || '',
      avatarUrl: channel.avatar_url,
      coverImageUrl: channel.cover_image_url,
      externalLinks: parseCreatorChannelExternalLinks(channel.external_links),
      updatedAt: channel.updated_at,
    },
    artworks: creatorArtworks,
  }
}
