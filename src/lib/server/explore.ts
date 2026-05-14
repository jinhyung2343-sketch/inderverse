import 'server-only'

import { cache } from 'react'
import { artworkBackendMap } from '@/lib/mock/explore-backend-map'
import {
  categories,
  getEpisodePublicId,
  type ExploreArtwork,
} from '@/lib/explore'
import { artworks as fallbackArtworks, getArtworkById as getFallbackArtworkById } from '@/lib/mock/explore-data'
import { createAdminClient } from '@/lib/supabase/admin'
import { getViewerSession } from '@/lib/server/viewer-session'
import type { Database } from '@/lib/supabase/types'

type ChannelRow = Pick<
  Database['public']['Tables']['channels']['Row'],
  | 'comment_policy_note'
  | 'id'
  | 'title'
  | 'description'
  | 'cover_image_url'
  | 'is_adult_only'
  | 'is_comment_enabled'
  | 'status'
  | 'wait_free_hours'
  | 'work_type'
  | 'creator_channel_id'
  | 'created_at'
  | 'updated_at'
> & {
  creator?: {
    display_name: string
  } | null
  creator_channel?: {
    slug: string
    display_name: string
    avatar_url: string | null
  } | null
}

type EpisodeRow = Pick<
  Database['public']['Tables']['episodes']['Row'],
  | 'id'
  | 'channel_id'
  | 'episode_number'
  | 'title'
  | 'body_text'
  | 'pricing_type'
  | 'status'
  | 'published_at'
  | 'is_adult_only'
>

type EpisodeImageRow = Pick<
  Database['public']['Tables']['episode_images']['Row'],
  'episode_id' | 'image_url' | 'optimized_image_url' | 'sort_order'
>

type ChannelTagRow = Pick<
  Database['public']['Tables']['channel_tags']['Row'],
  'channel_id' | 'tag_id'
>

type TagRow = Pick<
  Database['public']['Tables']['tags']['Row'],
  'id' | 'name' | 'category' | 'is_adult_only'
>

interface ArtworkBundle {
  channel: ChannelRow
  episodes: EpisodeRow[]
  episodeImagesByEpisodeId: Map<string, string[]>
  tags: TagRow[]
}

const PUBLIC_CHANNEL_STATUSES: Database['public']['Enums']['channel_status'][] = [
  'publishing',
  'completed',
]

const KNOWN_CATEGORIES = categories.filter((category) => category !== '전체')
const publicArtworkIdByChannelId = new Map(
  Object.entries(artworkBackendMap)
    .filter(([, value]) => typeof value.backendChannelId === 'string' && value.backendChannelId.length > 0)
    .map(([artworkId, value]) => [value.backendChannelId as string, artworkId])
)

function isNextRuntimeSignal(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('DYNAMIC_')
  )
}

function isExploreSchemaUnavailable(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false
  }

  const message = error.message ?? ''

  return (
    error.code === '22P02' ||
    error.code === '42703' ||
    message.includes('invalid input value for enum work_type') ||
    message.includes('Could not find') ||
    message.includes('body_text') ||
    message.includes('novel')
  )
}

function mapArtworkStatus(
  status: Database['public']['Enums']['channel_status']
): ExploreArtwork['status'] {
  return status === 'completed' ? 'completed' : 'publishing'
}

function mapEpisodeAccessState(episode: EpisodeRow) {
  if (episode.status !== 'published') {
    return {
      accessState: 'coming_soon' as const,
      accessLabel: '준비중',
    }
  }

  if (episode.pricing_type === 'wait_free') {
    return {
      accessState: 'wait_free' as const,
      accessLabel: '기다리면 무료',
    }
  }

  if (episode.pricing_type === 'paid') {
    return {
      accessState: 'locked' as const,
      accessLabel: '잠금',
    }
  }

  return {
    accessState: 'free' as const,
    accessLabel: '무료',
  }
}

function deriveCategory(tags: TagRow[]) {
  const genreTags = tags.filter((tag) => tag.category === 'genre').map((tag) => tag.name)
  const matched = KNOWN_CATEGORIES.find((category) => genreTags.includes(category))

  return matched ?? '드라마'
}

function deriveFilterTags(channel: ChannelRow, episodes: EpisodeRow[]) {
  const tags = new Set<string>()

  tags.add('추천')

  if (channel.status === 'completed') {
    tags.add('완결')
  } else {
    tags.add('최신')
  }

  if (episodes.some((episode) => episode.pricing_type === 'wait_free') || channel.wait_free_hours > 0) {
    tags.add('기다리면 무료')
  }

  if (episodes.filter((episode) => episode.status === 'published').length >= 3) {
    tags.add('인기')
  }

  return Array.from(tags)
}

function buildGenericEpisodePreview(artworkTitle: string, episodeTitle: string) {
  return `${artworkTitle}의 ${episodeTitle}입니다. 실제 회차 소개 문구는 추후 스튜디오 편집 흐름에 연결할 수 있습니다.`
}

function buildNovelEpisodePreview(bodyText: string, episodeTitle: string) {
  const firstParagraph = bodyText
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .find(Boolean)

  if (!firstParagraph) {
    return `${episodeTitle} 본문은 아직 준비 중입니다.`
  }

  return firstParagraph.length > 120 ? `${firstParagraph.slice(0, 120)}...` : firstParagraph
}

function buildNovelEpisodeBody(bodyText: string) {
  return bodyText
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function buildGenericEpisodeBody(artworkTitle: string, episodeTitle: string, hasImages: boolean) {
  if (hasImages) {
    return [
      `${artworkTitle}의 ${episodeTitle} 이미지가 아래에 표시됩니다.`,
      '현재는 회차 본문 텍스트 대신 업로드된 이미지 자산을 우선 렌더링하는 구조로 연결했습니다.',
    ]
  }

  return [
    `${artworkTitle}의 ${episodeTitle}는 실제 채널 데이터에 연결되어 있습니다.`,
    '아직 이미지나 본문 자산이 등록되지 않아 기본 안내 문구를 먼저 표시합니다.',
  ]
}

function buildGenericCommentPreview(title: string) {
  return `${title}의 댓글 흐름은 아직 실제 댓글 시스템과 연결되지 않았습니다. 현재는 작품 상세 구조를 점검하기 위한 안내 상태입니다.`
}

function mapBackendArtwork(bundle: ArtworkBundle): ExploreArtwork {
  const publicArtworkId = publicArtworkIdByChannelId.get(bundle.channel.id) ?? bundle.channel.id
  const tags = bundle.tags.map((tag) => tag.name)
  const title = bundle.channel.title.trim() || '제목 미정'
  const orderedEpisodes = [...bundle.episodes]
    .sort((left, right) => left.episode_number - right.episode_number)
  const summary =
    bundle.channel.description?.trim() ||
    '아직 작품 소개가 입력되지 않은 채널입니다.'
  const intro =
    bundle.channel.description?.trim() ||
    '작품 소개는 준비 중이며, 현재는 실제 채널 메타데이터를 기준으로 상세 구조를 점검할 수 있습니다.'

  return {
    id: publicArtworkId,
    workType: bundle.channel.work_type === 'novel' ? 'novel' : 'webtoon',
    title,
    authorName:
      bundle.channel.creator_channel?.display_name?.trim() ||
      bundle.channel.creator?.display_name?.trim() ||
      '작가',
    authorAvatarUrl: bundle.channel.creator_channel?.avatar_url ?? null,
    creatorSlug: bundle.channel.creator_channel?.slug ?? null,
    coverImageUrl: bundle.channel.cover_image_url?.trim() || '',
    status: mapArtworkStatus(bundle.channel.status),
    isAdultOnly: bundle.channel.is_adult_only,
    isCommentEnabled: bundle.channel.is_comment_enabled,
    category: deriveCategory(bundle.tags),
    filterTags: deriveFilterTags(bundle.channel, orderedEpisodes),
    tags,
    blurb: summary,
    summary,
    intro,
    commentPreview:
      bundle.channel.comment_policy_note?.trim() ||
      buildGenericCommentPreview(title),
    episodes: orderedEpisodes.map((episode) => {
      const imageUrls = bundle.episodeImagesByEpisodeId.get(episode.id) ?? []
      const access = mapEpisodeAccessState(episode)

      return {
        id: getEpisodePublicId(episode.episode_number),
        backendEpisodeId: episode.id,
        backendChannelId: bundle.channel.id,
        workType: bundle.channel.work_type === 'novel' ? 'novel' : 'webtoon',
        title: episode.title,
        accessState: access.accessState,
        accessLabel: access.accessLabel,
        waitFreeHours:
          access.accessState === 'wait_free'
            ? bundle.channel.wait_free_hours
            : undefined,
        preview:
          bundle.channel.work_type === 'novel'
            ? buildNovelEpisodePreview(episode.body_text?.trim() || '', episode.title)
            : buildGenericEpisodePreview(title, episode.title),
        body:
          bundle.channel.work_type === 'novel'
            ? buildNovelEpisodeBody(episode.body_text?.trim() || '')
            : buildGenericEpisodeBody(title, episode.title, imageUrls.length > 0),
        imageUrls,
      }
    }),
  }
}

async function loadPublicChannels({
  isAdultVerified,
}: {
  isAdultVerified: boolean
}) {
  const admin = createAdminClient()
  const selectColumns = `
    id,
    title,
    description,
    cover_image_url,
    is_adult_only,
    is_comment_enabled,
    comment_policy_note,
    status,
    wait_free_hours,
    work_type,
    creator_channel_id,
    created_at,
    updated_at,
    creator:profiles!channels_creator_id_fkey(display_name),
    creator_channel:creator_channels!channels_creator_channel_id_fkey(slug, display_name, avatar_url)
  `
  let query = admin
    .from('channels')
    .select(selectColumns)
    .in('work_type', ['webtoon', 'novel'])
    .in('status', PUBLIC_CHANNEL_STATUSES)
    .order('updated_at', { ascending: false })

  if (!isAdultVerified) {
    query = query.eq('is_adult_only', false)
  }

  const result = await query

  if (!result.error) {
    return (result.data ?? []) as ChannelRow[]
  }

  if (!isExploreSchemaUnavailable(result.error)) {
    throw new Error(`Failed to load explore channels: ${result.error.message}`)
  }

  console.warn('Novel explore schema is not available yet. Falling back to webtoon-only explore.')

  let fallbackQuery = admin
    .from('channels')
    .select(selectColumns)
    .eq('work_type', 'webtoon')
    .in('status', PUBLIC_CHANNEL_STATUSES)
    .order('updated_at', { ascending: false })

  if (!isAdultVerified) {
    fallbackQuery = fallbackQuery.eq('is_adult_only', false)
  }

  const fallbackResult = await fallbackQuery

  if (fallbackResult.error) {
    throw new Error(`Failed to load explore channels: ${fallbackResult.error.message}`)
  }

  return (fallbackResult.data ?? []) as ChannelRow[]
}

async function loadPublicEpisodes({
  channelIds,
  isAdultVerified,
}: {
  channelIds: string[]
  isAdultVerified: boolean
}) {
  const admin = createAdminClient()
  let episodeQuery = admin
    .from('episodes')
    .select(
      'id, channel_id, episode_number, title, body_text, pricing_type, status, published_at, is_adult_only'
    )
    .in('channel_id', channelIds)
    .order('episode_number', { ascending: true })

  if (!isAdultVerified) {
    episodeQuery = episodeQuery.eq('is_adult_only', false)
  }

  const result = await episodeQuery

  if (!result.error) {
    return (result.data ?? []) as EpisodeRow[]
  }

  if (!isExploreSchemaUnavailable(result.error)) {
    throw new Error(`Failed to load explore episodes: ${result.error.message}`)
  }

  console.warn('Novel episode body schema is not available yet. Falling back to legacy episode fields.')

  let fallbackQuery = admin
    .from('episodes')
    .select(
      'id, channel_id, episode_number, title, pricing_type, status, published_at, is_adult_only'
    )
    .in('channel_id', channelIds)
    .order('episode_number', { ascending: true })

  if (!isAdultVerified) {
    fallbackQuery = fallbackQuery.eq('is_adult_only', false)
  }

  const fallbackResult = await fallbackQuery

  if (fallbackResult.error) {
    throw new Error(`Failed to load explore episodes: ${fallbackResult.error.message}`)
  }

  return ((fallbackResult.data ?? []) as Omit<EpisodeRow, 'body_text'>[]).map((episode) => ({
    ...episode,
    body_text: null,
  }))
}

const getPublicArtworkBundles = cache(async () => {
  const { isAdultVerified } = await getViewerSession()
  const admin = createAdminClient()
  const channelRows = await loadPublicChannels({ isAdultVerified })
  const channelIds = channelRows.map((channel) => channel.id)

  if (channelIds.length === 0) {
    return []
  }

  const episodeRows = await loadPublicEpisodes({ channelIds, isAdultVerified })
  const episodeIds = episodeRows.map((episode) => episode.id)

  const [channelTagsResult, tagsResult, imagesResult] = await Promise.all([
    admin.from('channel_tags').select('channel_id, tag_id').in('channel_id', channelIds),
    admin.from('tags').select('id, name, category, is_adult_only'),
    episodeIds.length > 0
      ? admin
          .from('episode_images')
          .select('episode_id, image_url, optimized_image_url, sort_order')
          .in('episode_id', episodeIds)
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ])

  if (channelTagsResult.error) {
    throw new Error(`Failed to load explore channel tags: ${channelTagsResult.error.message}`)
  }

  if (tagsResult.error) {
    throw new Error(`Failed to load explore tags: ${tagsResult.error.message}`)
  }

  if (imagesResult.error) {
    throw new Error(`Failed to load explore episode images: ${imagesResult.error.message}`)
  }

  const channelTagRows = (channelTagsResult.data ?? []) as ChannelTagRow[]
  const tagRows = (tagsResult.data ?? []) as TagRow[]
  const imageRows = (imagesResult.data ?? []) as EpisodeImageRow[]

  const tagsById = new Map(tagRows.map((tag) => [tag.id, tag]))
  const tagsByChannelId = new Map<string, TagRow[]>()

  channelTagRows.forEach((entry) => {
    const tag = tagsById.get(entry.tag_id)

    if (!tag) {
      return
    }

    const bucket = tagsByChannelId.get(entry.channel_id)

    if (bucket) {
      bucket.push(tag)
      return
    }

    tagsByChannelId.set(entry.channel_id, [tag])
  })

  const episodesByChannelId = new Map<string, EpisodeRow[]>()
  episodeRows.forEach((episode) => {
    const bucket = episodesByChannelId.get(episode.channel_id)

    if (bucket) {
      bucket.push(episode)
      return
    }

    episodesByChannelId.set(episode.channel_id, [episode])
  })

  const imageUrlsByEpisodeId = new Map<string, string[]>()
  imageRows.forEach((image) => {
    const bucket = imageUrlsByEpisodeId.get(image.episode_id)

    if (bucket) {
      bucket.push(image.optimized_image_url ?? image.image_url)
      return
    }

    imageUrlsByEpisodeId.set(image.episode_id, [image.optimized_image_url ?? image.image_url])
  })

  return channelRows.map((channel) => ({
    channel,
    episodes: episodesByChannelId.get(channel.id) ?? [],
    episodeImagesByEpisodeId: imageUrlsByEpisodeId,
    tags: tagsByChannelId.get(channel.id) ?? [],
  }))
})

export async function getPublicArtworkList() {
  try {
    const bundles = await getPublicArtworkBundles()
    return bundles.map(mapBackendArtwork)
  } catch (error) {
    if (isNextRuntimeSignal(error)) {
      throw error
    }

    if (process.env.NODE_ENV === 'production') {
      throw error
    }

    console.warn('Falling back to mock explore artworks:', error)
    return fallbackArtworks.filter((artwork) => !artwork.isAdultOnly)
  }
}

export async function getPublicArtworkById(id: string) {
  try {
    const bundles = await getPublicArtworkBundles()
    const bundle = bundles.find((entry) => {
      const publicArtworkId = publicArtworkIdByChannelId.get(entry.channel.id) ?? entry.channel.id
      return entry.channel.id === id || publicArtworkId === id
    })

    if (!bundle) {
      return null
    }

    return mapBackendArtwork(bundle)
  } catch (error) {
    if (isNextRuntimeSignal(error)) {
      throw error
    }

    if (process.env.NODE_ENV === 'production') {
      throw error
    }

    console.warn('Falling back to mock explore artwork:', error)
    const artwork = getFallbackArtworkById(id)

    if (!artwork || artwork.isAdultOnly) {
      return null
    }

    return artwork
  }
}

function getSimilarityScore(base: ExploreArtwork, candidate: ExploreArtwork) {
  let score = 0

  if (base.category === candidate.category) {
    score += 5
  }

  const sharedTags = candidate.tags.filter((tag) => base.tags.includes(tag)).length
  score += sharedTags * 3

  if (base.status === candidate.status) {
    score += 1
  }

  return score
}

export async function getRelatedArtworks(artwork: ExploreArtwork, limit = 4) {
  const feed = await getPublicArtworkList()

  return feed
    .filter((candidate) => candidate.id !== artwork.id)
    .map((candidate) => ({
      candidate,
      score: getSimilarityScore(artwork, candidate),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.candidate)
}
