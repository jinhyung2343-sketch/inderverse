import 'server-only'

import { unstable_cache } from 'next/cache'
import { PUBLIC_CACHE_REVALIDATE_SECONDS, PUBLIC_CACHE_TAGS } from '@/lib/public-cache'
import { parseCreatorChannelExternalLinks } from '@/lib/server/creator-channels'
import { getPublicArtworkList } from '@/lib/server/explore'
import { withPublicDataRetry } from '@/lib/server/public-data-retry'
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
type PublicCreatorChannelQueryResult = {
  data: unknown
  error: { message: string } | null
}
const PUBLIC_DATA_TIMEOUT_MS = 3000

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

function isRecoverablePublicDataError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return (
    message.includes('schema cache') ||
    message.includes('Could not find') ||
    message.includes('Failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('timeout')
  )
}

function withPublicDataTimeout<T>(promise: PromiseLike<T>) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Public creator channel data timeout')), PUBLIC_DATA_TIMEOUT_MS)
    }),
  ])
}

async function loadPublicCreatorChannelRows() {
  const admin = createAdminClient()
  const { data, error } = await withPublicDataTimeout(
    withPublicDataRetry(
      () => admin
        .from('creator_channels')
        .select('id, owner_id, slug, display_name, bio, avatar_url, cover_image_url, external_links, status, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false }),
      isRecoverablePublicDataError
    )
  ) as PublicCreatorChannelQueryResult

  if (error) {
    throw new Error(`Failed to load public creator channels: ${error.message}`)
  }

  return (data ?? []) as PublicCreatorChannelRow[]
}

const getCachedPublicCreatorChannelRows = unstable_cache(
  loadPublicCreatorChannelRows,
  ['public-creator-channel-rows-v2'],
  {
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.creators, PUBLIC_CACHE_TAGS.navigation],
  }
)

const getCachedPublicCreatorChannelRowBySlug = unstable_cache(
  async (slug: string) => {
    const admin = createAdminClient()
    const { data, error } = await withPublicDataTimeout(
      withPublicDataRetry(
        () => admin
          .from('creator_channels')
          .select('id, owner_id, slug, display_name, bio, avatar_url, cover_image_url, external_links, status, updated_at')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle(),
        isRecoverablePublicDataError
      )
    ) as PublicCreatorChannelQueryResult

    if (error) {
      throw new Error(`Failed to load public creator channel: ${error.message}`)
    }

    return data ? data as PublicCreatorChannelRow : null
  },
  ['public-creator-channel-row-by-slug-v2'],
  {
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.creators, PUBLIC_CACHE_TAGS.navigation],
  }
)

export async function getPublicCreatorChannelList(
  options: {
    includeAdultContent?: boolean
    viewerId?: string | null
  } = {}
) {
  try {
    const channels = await getCachedPublicCreatorChannelRows()
    const artworks = await getPublicArtworkList(options)
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
  } catch (error) {
    if (!isRecoverablePublicDataError(error)) {
      throw error
    }

    console.warn('Falling back to an empty public creator channel list:', error)
    return []
  }
}

export async function getPublicCreatorChannelPage(
  slug: string,
  options: {
    includeAdultContent?: boolean
    viewerId?: string | null
  } = {}
) {
  if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(slug)) {
    return null
  }

  try {
    const channel = await getCachedPublicCreatorChannelRowBySlug(slug)

    if (!channel) {
      return null
    }

    const artworks = await getPublicArtworkList(options)
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
  } catch (error) {
    if (!isRecoverablePublicDataError(error)) {
      throw error
    }

    console.warn('Falling back to a missing public creator channel:', error)
    return null
  }
}
