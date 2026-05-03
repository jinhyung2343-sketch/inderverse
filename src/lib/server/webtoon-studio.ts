import 'server-only'

import { BRAND } from '@/lib/brand'
import { decryptBankInfo, getMaskedBankSummary } from '@/lib/security/bank-info'
import { createClient } from '@/lib/supabase/server'
import type { CreatorWebtoonListItem, CreatorWebtoonRecord } from '@/lib/webtoon'
import { parseSerializationDays } from '@/lib/webtoon'
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
  'episode_id' | 'image_url' | 'sort_order'
>

type ChannelTagRow = Pick<
  Database['public']['Tables']['channel_tags']['Row'],
  'channel_id' | 'tag_id'
>

type TagRow = Pick<
  Database['public']['Tables']['tags']['Row'],
  'id' | 'name' | 'category'
>

type RevenueSettingsRow = Pick<
  Database['public']['Tables']['revenue_settings']['Row'],
  'channel_id' | 'creator_share_pct' | 'min_payout_amount' | 'payout_method' | 'bank_info_encrypted'
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
      'id, title, description, cover_image_url, is_adult_only, is_comment_enabled, comment_policy_note, status, wait_free_hours, serialization_days, updated_at'
    )
    .eq('creator_id', user.id)
    .eq('work_type', 'webtoon')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load creator webtoons: ${error.message}`)
  }

  return (data ?? []) as ChannelRow[]
}

async function getSupportingRows(channelIds: string[]) {
  const supabase = await createClient()

  if (channelIds.length === 0) {
    return {
      episodes: [] as EpisodeRow[],
      images: [] as EpisodeImageRow[],
      channelTags: [] as ChannelTagRow[],
      tags: [] as TagRow[],
      revenueSettings: [] as RevenueSettingsRow[],
    }
  }

  const [episodesResult, tagsResult, channelTagsResult, revenueSettingsResult] = await Promise.all([
    supabase
      .from('episodes')
      .select('id, channel_id, episode_number, title, pricing_type, coin_price, is_adult_only, status, published_at')
      .in('channel_id', channelIds)
      .order('episode_number', { ascending: true }),
    supabase.from('tags').select('id, name, category'),
    supabase.from('channel_tags').select('channel_id, tag_id').in('channel_id', channelIds),
    supabase
      .from('revenue_settings')
      .select('channel_id, creator_share_pct, min_payout_amount, payout_method, bank_info_encrypted')
      .in('channel_id', channelIds),
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

  if (revenueSettingsResult.error) {
    throw new Error(`Failed to load revenue settings: ${revenueSettingsResult.error.message}`)
  }

  const episodeIds = (episodesResult.data ?? []).map((episode) => episode.id)
  const imagesResult = episodeIds.length
    ? await supabase
        .from('episode_images')
        .select('episode_id, image_url, sort_order')
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
    revenueSettings: (revenueSettingsResult.data ?? []) as RevenueSettingsRow[],
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
        imageUrl: image.image_url,
        sortOrder: image.sort_order,
      })),
    }))
}

export async function getCreatorWebtoonList(): Promise<CreatorWebtoonListItem[]> {
  const channels = await getCreatorChannelRows()
  const channelIds = channels.map((channel) => channel.id)
  const { episodes, channelTags, tags, revenueSettings } = await getSupportingRows(channelIds)
  const tagsByChannelId = buildTagMap(channelTags, tags)

  return channels.map((channel) => {
    const channelTags = tagsByChannelId.get(channel.id) ?? []
    const revenue = revenueSettings.find((entry) => entry.channel_id === channel.id)
    const bankInfo = decryptBankInfo(revenue?.bank_info_encrypted ?? null)

    return {
      id: channel.id,
      title: channel.title,
      coverImageUrl: channel.cover_image_url,
      status: channel.status,
      category: getCategory(channelTags),
      tags: channelTags.map((tag) => tag.name),
      episodeCount: episodes.filter((episode) => episode.channel_id === channel.id).length,
      updatedAt: channel.updated_at,
      revenueSettings: {
        creatorSharePct: revenue?.creator_share_pct ?? BRAND.creatorSharePct,
        minPayoutAmount: revenue?.min_payout_amount ?? 10000,
        payoutMethod: revenue?.payout_method ?? null,
        maskedBankSummary: getMaskedBankSummary(bankInfo),
        hasStoredBankInfo: Boolean(revenue?.bank_info_encrypted),
      },
    }
  })
}

export async function getCreatorWebtoonById(id: string): Promise<CreatorWebtoonRecord | null> {
  const channels = await getCreatorChannelRows()
  const channel = channels.find((entry) => entry.id === id)

  if (!channel) {
    return null
  }

  const { episodes, images, channelTags, tags, revenueSettings } = await getSupportingRows([id])
  const tagsByChannelId = buildTagMap(channelTags, tags)
  const channelTagsForChannel = tagsByChannelId.get(id) ?? []
  const revenue = revenueSettings.find((entry) => entry.channel_id === id)
  const bankInfo = decryptBankInfo(revenue?.bank_info_encrypted ?? null)

  return {
    id: channel.id,
    title: channel.title,
    description: channel.description?.trim() || '',
    coverImageUrl: channel.cover_image_url,
    isAdultOnly: channel.is_adult_only,
    isCommentEnabled: channel.is_comment_enabled,
    commentPolicyNote: channel.comment_policy_note?.trim() || null,
    status: channel.status,
    waitFreeHours: channel.wait_free_hours,
    serializationDays: parseSerializationDays(channel.serialization_days),
    category: getCategory(channelTagsForChannel),
    tags: channelTagsForChannel.map((tag) => tag.name),
    creatorName: '작가',
    updatedAt: channel.updated_at,
    episodes: mapEpisodes(id, episodes, images),
    revenueSettings: {
      creatorSharePct: revenue?.creator_share_pct ?? BRAND.creatorSharePct,
      minPayoutAmount: revenue?.min_payout_amount ?? 10000,
      payoutMethod: revenue?.payout_method ?? null,
      bankInfo: {
        bankName: bankInfo?.bankName ?? '',
        accountHolder: bankInfo?.accountHolder ?? '',
        accountNumber: bankInfo?.accountNumber ?? '',
        maskedSummary: getMaskedBankSummary(bankInfo),
        hasStoredInfo: Boolean(revenue?.bank_info_encrypted),
      },
    },
  }
}
