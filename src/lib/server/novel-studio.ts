import 'server-only'

import { parseRatingChecklist } from '@/lib/content-rating'
import { createClient } from '@/lib/supabase/server'
import type { CreatorNovelListItem, CreatorNovelRecord } from '@/lib/novel'
import type { Database } from '@/lib/supabase/types'

type ChannelRow = Pick<
  Database['public']['Tables']['channels']['Row'],
  | 'age_rating'
  | 'comment_policy_note'
  | 'id'
  | 'title'
  | 'description'
  | 'cover_image_url'
  | 'is_adult_only'
  | 'is_comment_enabled'
  | 'rating_checklist'
  | 'status'
  | 'wait_free_hours'
  | 'updated_at'
>

type EpisodeRow = Pick<
  Database['public']['Tables']['episodes']['Row'],
  | 'id'
  | 'channel_id'
  | 'episode_number'
  | 'title'
  | 'body_text'
  | 'pricing_type'
  | 'coin_price'
  | 'is_adult_only'
  | 'status'
  | 'published_at'
>

type ChannelTagRow = Pick<
  Database['public']['Tables']['channel_tags']['Row'],
  'channel_id' | 'tag_id'
>

type TagRow = Pick<
  Database['public']['Tables']['tags']['Row'],
  'id' | 'name' | 'category'
>

const DEFAULT_CATEGORY = '판타지'

function isNovelSchemaUnavailable(error: { code?: string; message?: string } | null) {
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

async function getCreatorNovelRows() {
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
      'id, title, description, cover_image_url, age_rating, rating_checklist, is_adult_only, is_comment_enabled, comment_policy_note, status, wait_free_hours, updated_at'
    )
    .eq('creator_id', user.id)
    .eq('work_type', 'novel')
    .order('updated_at', { ascending: false })

  if (error) {
    if (isNovelSchemaUnavailable(error)) {
      console.warn('Novel schema is not available yet. Run the latest Supabase migrations to enable novel studio.')
      return []
    }

    throw new Error(`Failed to load creator novels: ${error.message}`)
  }

  return (data ?? []) as ChannelRow[]
}

async function getSupportingRows(channelIds: string[]) {
  const supabase = await createClient()

  if (channelIds.length === 0) {
    return {
      episodes: [] as EpisodeRow[],
      channelTags: [] as ChannelTagRow[],
      tags: [] as TagRow[],
    }
  }

  const [episodesResult, tagsResult, channelTagsResult] = await Promise.all([
    supabase
      .from('episodes')
      .select('id, channel_id, episode_number, title, body_text, pricing_type, coin_price, is_adult_only, status, published_at')
      .in('channel_id', channelIds)
      .order('episode_number', { ascending: true }),
    supabase.from('tags').select('id, name, category'),
    supabase.from('channel_tags').select('channel_id, tag_id').in('channel_id', channelIds),
  ])

  if (episodesResult.error) {
    if (isNovelSchemaUnavailable(episodesResult.error)) {
      console.warn('Novel episode schema is not available yet. Run the latest Supabase migrations to enable novel episodes.')
      return {
        episodes: [] as EpisodeRow[],
        channelTags: [] as ChannelTagRow[],
        tags: [] as TagRow[],
      }
    }

    throw new Error(`Failed to load creator novel episodes: ${episodesResult.error.message}`)
  }

  if (tagsResult.error) {
    throw new Error(`Failed to load tags: ${tagsResult.error.message}`)
  }

  if (channelTagsResult.error) {
    throw new Error(`Failed to load channel tags: ${channelTagsResult.error.message}`)
  }

  return {
    episodes: (episodesResult.data ?? []) as EpisodeRow[],
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

function mapEpisodes(channelId: string, episodes: EpisodeRow[]) {
  return episodes
    .filter((episode) => episode.channel_id === channelId)
    .map((episode) => ({
      id: episode.id,
      episodeNumber: episode.episode_number,
      title: episode.title,
      bodyText: episode.body_text?.trim() || '',
      pricingType: episode.pricing_type,
      coinPrice: episode.coin_price,
      isAdultOnly: episode.is_adult_only,
      status: episode.status,
      publishedAt: episode.published_at,
    }))
}

export async function getCreatorNovelList(): Promise<CreatorNovelListItem[]> {
  const channels = await getCreatorNovelRows()
  const channelIds = channels.map((channel) => channel.id)
  const { episodes, channelTags, tags } = await getSupportingRows(channelIds)
  const tagsByChannelId = buildTagMap(channelTags, tags)

  return channels.map((channel) => {
    const channelTags = tagsByChannelId.get(channel.id) ?? []

    return {
      id: channel.id,
      title: channel.title,
      coverImageUrl: channel.cover_image_url,
      ageRating: channel.age_rating as CreatorNovelListItem['ageRating'],
      status: channel.status,
      category: getCategory(channelTags),
      tags: channelTags.map((tag) => tag.name),
      episodeCount: episodes.filter((episode) => episode.channel_id === channel.id).length,
      updatedAt: channel.updated_at,
    }
  })
}

export async function getCreatorNovelById(id: string): Promise<CreatorNovelRecord | null> {
  const channels = await getCreatorNovelRows()
  const channel = channels.find((entry) => entry.id === id)

  if (!channel) {
    return null
  }

  const { episodes, channelTags, tags } = await getSupportingRows([id])
  const tagsByChannelId = buildTagMap(channelTags, tags)
  const channelTagsForChannel = tagsByChannelId.get(id) ?? []

  return {
    id: channel.id,
    title: channel.title,
    description: channel.description?.trim() || '',
    coverImageUrl: channel.cover_image_url,
    ageRating: channel.age_rating as CreatorNovelRecord['ageRating'],
    ratingChecklist: parseRatingChecklist(channel.rating_checklist),
    isAdultOnly: channel.is_adult_only,
    isCommentEnabled: channel.is_comment_enabled,
    commentPolicyNote: channel.comment_policy_note?.trim() || null,
    status: channel.status,
    waitFreeHours: channel.wait_free_hours,
    category: getCategory(channelTagsForChannel),
    tags: channelTagsForChannel.map((tag) => tag.name),
    creatorName: '작가',
    updatedAt: channel.updated_at,
    episodes: mapEpisodes(id, episodes),
  }
}
