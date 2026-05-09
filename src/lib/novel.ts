import type { Database } from '@/lib/supabase/types'
import type { ChannelAgeRating, RatingChecklist } from '@/lib/content-rating'
import { getAgeRatingLabel as getSharedAgeRatingLabel } from '@/lib/content-rating'

export type NovelStatus = Database['public']['Enums']['channel_status']
export type NovelEpisodePricing = Database['public']['Enums']['episode_pricing']
export type NovelEpisodeStatus = Database['public']['Enums']['episode_status']

export interface CreatorNovelEpisodeRecord {
  id: string
  episodeNumber: number
  title: string
  bodyText: string
  pricingType: NovelEpisodePricing
  coinPrice: number
  isAdultOnly: boolean
  status: NovelEpisodeStatus
  publishedAt: string | null
}

export interface CreatorNovelRecord {
  id: string
  title: string
  description: string
  coverImageUrl: string | null
  ageRating: ChannelAgeRating
  ratingChecklist: RatingChecklist
  isAdultOnly: boolean
  isCommentEnabled: boolean
  commentPolicyNote: string | null
  status: NovelStatus
  waitFreeHours: number
  category: string
  tags: string[]
  creatorName: string
  updatedAt: string
  episodes: CreatorNovelEpisodeRecord[]
}

export interface CreatorNovelListItem {
  id: string
  title: string
  coverImageUrl: string | null
  ageRating: ChannelAgeRating
  status: NovelStatus
  category: string
  tags: string[]
  episodeCount: number
  updatedAt: string
}

export interface NovelDraftInput {
  title: string
  description: string
  coverImageUrl: string | null
  ageRating: ChannelAgeRating
  ratingChecklist: RatingChecklist
  isAdultOnly: boolean
  isCommentEnabled: boolean
  commentPolicyNote: string | null
  status: NovelStatus
  waitFreeHours: number
  category: string
  tags: string[]
}

export interface NovelEpisodeDraftInput {
  title: string
  episodeNumber: number
  bodyText: string
  pricingType: NovelEpisodePricing
  coinPrice: number
  isAdultOnly: boolean
  status: NovelEpisodeStatus
}

export function sanitizeNovelTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 12)
    )
  )
}

export function getNovelStatusLabel(status: NovelStatus) {
  switch (status) {
    case 'draft':
      return '초안'
    case 'publishing':
      return '연재 중'
    case 'completed':
      return '완결'
    case 'suspended':
      return '중지'
    default:
      return status
  }
}

export function getNovelEpisodeStatusLabel(status: NovelEpisodeStatus) {
  switch (status) {
    case 'draft':
      return '초안'
    case 'published':
      return '공개'
    case 'hidden':
      return '숨김'
    default:
      return status
  }
}

export function getNovelEpisodePricingLabel(pricingType: NovelEpisodePricing) {
  switch (pricingType) {
    case 'free':
      return '무료'
    case 'paid':
      return '유료'
    case 'wait_free':
      return '기다리면 무료'
    default:
      return pricingType
  }
}

export function getAgeRatingLabel(rating: ChannelAgeRating) {
  return getSharedAgeRatingLabel(rating)
}
