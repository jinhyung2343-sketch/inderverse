import 'server-only'

import { cache } from 'react'
import { artworkBackendMap } from '@/lib/mock/explore-backend-map'
import {
  categories,
  getEpisodePublicId,
  type ExploreArtwork,
} from '@/lib/explore'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
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
  | 'created_at'
  | 'updated_at'
> & {
  creator?: {
    display_name: string
  } | null
}

type EpisodeRow = Pick<
  Database['public']['Tables']['episodes']['Row'],
  | 'id'
  | 'channel_id'
  | 'episode_number'
  | 'title'
  | 'pricing_type'
  | 'status'
  | 'published_at'
  | 'is_adult_only'
>

type EpisodeImageRow = Pick<
  Database['public']['Tables']['episode_images']['Row'],
  'episode_id' | 'image_url' | 'sort_order'
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

const getViewerSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      isAdultVerified: false,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_adult_verified')
    .eq('id', user.id)
    .single()

  return {
    isAdultVerified: profile?.is_adult_verified ?? false,
  }
})

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
    title,
    authorName: bundle.channel.creator?.display_name?.trim() || '작가',
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
        title: episode.title,
        accessState: access.accessState,
        accessLabel: access.accessLabel,
        waitFreeHours:
          access.accessState === 'wait_free'
            ? bundle.channel.wait_free_hours
            : undefined,
        preview: buildGenericEpisodePreview(title, episode.title),
        body: buildGenericEpisodeBody(title, episode.title, imageUrls.length > 0),
        imageUrls,
      }
    }),
  }
}

const getPublicArtworkBundles = cache(async () => {
  const { isAdultVerified } = await getViewerSession()
  const admin = createAdminClient()
  let channelQuery = admin
    .from('channels')
    .select(
      `
        id,
        title,
        description,
        cover_image_url,
        is_adult_only,
        is_comment_enabled,
        comment_policy_note,
        status,
        wait_free_hours,
        created_at,
        updated_at,
        creator:profiles!channels_creator_id_fkey(display_name)
      `
    )
    .eq('work_type', 'webtoon')
    .in('status', PUBLIC_CHANNEL_STATUSES)
    .order('updated_at', { ascending: false })

  if (!isAdultVerified) {
    channelQuery = channelQuery.eq('is_adult_only', false)
  }

  const { data: channels, error: channelsError } = await channelQuery

  if (channelsError) {
    throw new Error(`Failed to load explore channels: ${channelsError.message}`)
  }

  const channelRows = (channels ?? []) as ChannelRow[]
  const channelIds = channelRows.map((channel) => channel.id)

  if (channelIds.length === 0) {
    return []
  }

  let episodeQuery = admin
    .from('episodes')
    .select(
      'id, channel_id, episode_number, title, pricing_type, status, published_at, is_adult_only'
    )
    .in('channel_id', channelIds)
    .order('episode_number', { ascending: true })

  if (!isAdultVerified) {
    episodeQuery = episodeQuery.eq('is_adult_only', false)
  }

  const { data: episodes, error: episodesError } = await episodeQuery

  if (episodesError) {
    throw new Error(`Failed to load explore episodes: ${episodesError.message}`)
  }

  const episodeRows = (episodes ?? []) as EpisodeRow[]
  const episodeIds = episodeRows.map((episode) => episode.id)

  const [channelTagsResult, tagsResult, imagesResult] = await Promise.all([
    admin.from('channel_tags').select('channel_id, tag_id').in('channel_id', channelIds),
    admin.from('tags').select('id, name, category, is_adult_only'),
    episodeIds.length > 0
      ? admin
          .from('episode_images')
          .select('episode_id, image_url, sort_order')
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
      bucket.push(image.image_url)
      return
    }

    imageUrlsByEpisodeId.set(image.episode_id, [image.image_url])
  })

  return channelRows.map((channel) => ({
    channel,
    episodes: episodesByChannelId.get(channel.id) ?? [],
    episodeImagesByEpisodeId: imageUrlsByEpisodeId,
    tags: tagsByChannelId.get(channel.id) ?? [],
  }))
})

export async function getPublicArtworkList() {
  const bundles = await getPublicArtworkBundles()
  return bundles.map(mapBackendArtwork)
}

export async function getPublicArtworkById(id: string) {
  const bundles = await getPublicArtworkBundles()
  const bundle = bundles.find((entry) => {
    const publicArtworkId = publicArtworkIdByChannelId.get(entry.channel.id) ?? entry.channel.id
    return entry.channel.id === id || publicArtworkId === id
  })

  if (!bundle) {
    return null
  }

  return mapBackendArtwork(bundle)
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
