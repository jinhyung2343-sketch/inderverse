import 'server-only'

import { parseRatingChecklist } from '@/lib/content-rating'
import { createClient } from '@/lib/supabase/server'
import type { CreatorWebtoonListItem, CreatorWebtoonRecord } from '@/lib/webtoon'
import { parseSerializationDays } from '@/lib/webtoon'
import type { Database } from '@/lib/supabase/types'

type ChannelRow = Pick<
  Database['public']['Tables']['channels']['Row'],
  | 'age_rating'
  | 'comment_policy_note'
  | 'id'
  | 'total_episodes'
  | 'work_scale'
  | 'teaser_percentage'
  | 'is_free_archive'
  | 'title'
  | 'description'
  | 'cover_image_url'
  | 'is_adult_only'
  | 'is_comment_enabled'
  | 'rating_checklist'
  | 'status'
  | 'serialization_days'
  | 'updated_at'
>

type EpisodeRow = Pick<
  Database['public']['Tables']['episodes']['Row'],
  | 'id'
  | 'channel_id'
  | 'episode_number'
  | 'title'
  | 'pricing_type'
  | 'coin_price'
  | 'is_adult_only'
  | 'status'
  | 'published_at'
>

type EpisodeImageRow = Pick<
  Database['public']['Tables']['episode_images']['Row'],
  | 'episode_id'
  | 'image_url'
  | 'original_image_url'
  | 'optimized_image_url'
  | 'thumbnail_image_url'
  | 'sort_order'
  | 'width'
  | 'height'
  | 'file_size_bytes'
  | 'content_type'
  | 'derivatives'
  | 'is_verified'
  | 'processing_status'
  | 'processing_error'
  | 'cleanup_status'
  | 'original_file_path'
  | 'optimized_file_path'
  | 'thumbnail_file_path'
>

type ChannelTagRow = Pick<
  Database['public']['Tables']['channel_tags']['Row'],
  'channel_id' | 'tag_id'
>

type TagRow = Pick<
  Database['public']['Tables']['tags']['Row'],
  'id' | 'name' | 'category'
>

const DEFAULT_CATEGORY = '드라마'

async function getCreatorChannelRows() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('channels')
    .select(
      'id, title, description, cover_image_url, age_rating, rating_checklist, is_adult_only, is_comment_enabled, comment_policy_note, status, total_episodes, work_scale, teaser_percentage, is_free_archive, serialization_days, updated_at'
    )
    .eq('creator_id', user.id)
    .eq('work_type', 'webtoon')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load creator webtoons: ${error.message}`)
  }

  return (data ?? []) as ChannelRow[]
}

async function getCreatorChannelRowById(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('channels')
    .select(
      'id, title, description, cover_image_url, age_rating, rating_checklist, is_adult_only, is_comment_enabled, comment_policy_note, status, total_episodes, work_scale, teaser_percentage, is_free_archive, serialization_days, updated_at'
    )
    .eq('id', id)
    .eq('creator_id', user.id)
    .eq('work_type', 'webtoon')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load creator webtoon: ${error.message}`)
  }

  return data as ChannelRow | null
}

async function getCurrentCreatorDisplayName() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return '작가'
  }

  const { data } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  return data?.display_name?.trim() || user.email?.split('@')[0] || '작가'
}

async function getSupportingRows(channelIds: string[]) {
  const supabase = await createClient()

  if (channelIds.length === 0) {
    return {
      episodes: [] as EpisodeRow[],
      images: [] as EpisodeImageRow[],
      channelTags: [] as ChannelTagRow[],
      tags: [] as TagRow[],
    }
  }

  const [episodesResult, tagsResult, channelTagsResult] = await Promise.all([
    supabase
      .from('episodes')
      .select('id, channel_id, episode_number, title, pricing_type, coin_price, is_adult_only, status, published_at')
      .in('channel_id', channelIds)
      .order('episode_number', { ascending: true }),
    supabase.from('tags').select('id, name, category'),
    supabase.from('channel_tags').select('channel_id, tag_id').in('channel_id', channelIds),
  ])

  if (episodesResult.error) {
    throw new Error(`Failed to load creator episodes: ${episodesResult.error.message}`)
  }

  if (tagsResult.error) {
    throw new Error(`Failed to load tags: ${tagsResult.error.message}`)
  }

  if (channelTagsResult.error) {
    throw new Error(`Failed to load channel tags: ${channelTagsResult.error.message}`)
  }

  const episodeIds = (episodesResult.data ?? []).map((episode) => episode.id)
  const imagesResult = episodeIds.length
      ? await supabase
        .from('episode_images')
        .select('episode_id, image_url, original_image_url, optimized_image_url, thumbnail_image_url, sort_order, width, height, file_size_bytes, content_type, derivatives, is_verified, processing_status, processing_error, cleanup_status, original_file_path, optimized_file_path, thumbnail_file_path')
        .in('episode_id', episodeIds)
        .order('sort_order', { ascending: true })
    : { data: [], error: null }

  if (imagesResult.error) {
    throw new Error(`Failed to load episode images: ${imagesResult.error.message}`)
  }

  return {
    episodes: (episodesResult.data ?? []) as EpisodeRow[],
    images: (imagesResult.data ?? []) as EpisodeImageRow[],
    channelTags: (channelTagsResult.data ?? []) as ChannelTagRow[],
    tags: (tagsResult.data ?? []) as TagRow[],
  }
}

function buildTagMap(channelTags: ChannelTagRow[], tags: TagRow[]) {
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]))
  const tagsByChannelId = new Map<string, TagRow[]>()

  channelTags.forEach((entry) => {
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

  return tagsByChannelId
}

function getCategory(tags: TagRow[]) {
  return tags.find((tag) => tag.category === 'genre')?.name ?? DEFAULT_CATEGORY
}

function mapEpisodes(
  channelId: string,
  episodes: EpisodeRow[],
  images: EpisodeImageRow[]
) {
  const imagesByEpisodeId = new Map<string, EpisodeImageRow[]>()

  images.forEach((image) => {
    const bucket = imagesByEpisodeId.get(image.episode_id)

    if (bucket) {
      bucket.push(image)
      return
    }

    imagesByEpisodeId.set(image.episode_id, [image])
  })

  return episodes
    .filter((episode) => episode.channel_id === channelId)
    .map((episode) => ({
      id: episode.id,
      episodeNumber: episode.episode_number,
      title: episode.title,
      pricingType: episode.pricing_type,
      coinPrice: episode.coin_price,
      isAdultOnly: episode.is_adult_only,
      status: episode.status,
      publishedAt: episode.published_at,
      images: (imagesByEpisodeId.get(episode.id) ?? []).map((image) => ({
        imageUrl: image.optimized_image_url ?? image.image_url,
        originalImageUrl: image.original_image_url,
        optimizedImageUrl: image.optimized_image_url,
        thumbnailImageUrl: image.thumbnail_image_url,
        sortOrder: image.sort_order,
        width: image.width,
        height: image.height,
        fileSizeBytes: image.file_size_bytes,
        contentType: image.content_type,
        derivatives: image.derivatives,
        isVerified: image.is_verified,
        processingStatus: image.processing_status,
        processingError: image.processing_error,
        cleanupStatus: image.cleanup_status,
        originalFilePath: image.original_file_path,
        optimizedFilePath: image.optimized_file_path,
        thumbnailFilePath: image.thumbnail_file_path,
      })),
    }))
}

export async function getCreatorWebtoonList(): Promise<CreatorWebtoonListItem[]> {
  const channels = await getCreatorChannelRows()
  const channelIds = channels.map((channel) => channel.id)
  const { episodes, channelTags, tags } = await getSupportingRows(channelIds)
  const tagsByChannelId = buildTagMap(channelTags, tags)

  return channels.map((channel) => {
    const channelTags = tagsByChannelId.get(channel.id) ?? []

    return {
      id: channel.id,
      title: channel.title,
      coverImageUrl: channel.cover_image_url,
      ageRating: channel.age_rating as CreatorWebtoonListItem['ageRating'],
      status: channel.status,
      workScale: channel.work_scale as CreatorWebtoonListItem['workScale'],
      category: getCategory(channelTags),
      tags: channelTags.map((tag) => tag.name),
      episodeCount: episodes.filter((episode) => episode.channel_id === channel.id).length,
      updatedAt: channel.updated_at,
    }
  })
}

export async function getCreatorWebtoonById(id: string): Promise<CreatorWebtoonRecord | null> {
  const channel = await getCreatorChannelRowById(id)

  if (!channel) {
    return null
  }

  const { episodes, images, channelTags, tags } = await getSupportingRows([id])
  const tagsByChannelId = buildTagMap(channelTags, tags)
  const channelTagsForChannel = tagsByChannelId.get(id) ?? []
  const creatorName = await getCurrentCreatorDisplayName()

  return {
    id: channel.id,
    title: channel.title,
    description: channel.description?.trim() || '',
    coverImageUrl: channel.cover_image_url,
    ageRating: channel.age_rating as CreatorWebtoonRecord['ageRating'],
    ratingChecklist: parseRatingChecklist(channel.rating_checklist),
    isAdultOnly: channel.is_adult_only,
    isCommentEnabled: channel.is_comment_enabled,
    commentPolicyNote: channel.comment_policy_note?.trim() || null,
    status: channel.status,
    totalEpisodes: channel.total_episodes,
    workScale: channel.work_scale as CreatorWebtoonRecord['workScale'],
    teaserPercentage: channel.teaser_percentage,
    isFreeArchive: channel.is_free_archive,
    serializationDays: parseSerializationDays(channel.serialization_days),
    category: getCategory(channelTagsForChannel),
    tags: channelTagsForChannel.map((tag) => tag.name),
    creatorName,
    updatedAt: channel.updated_at,
    episodes: mapEpisodes(id, episodes, images),
  }
}
