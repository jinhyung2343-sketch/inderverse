import type { Json, Database } from '@/lib/supabase/types'
import { getAgeRatingLabel as getSharedAgeRatingLabel } from '@/lib/content-rating'
import type { ChannelAgeRating, RatingChecklist } from '@/lib/content-rating'

export type WebtoonStatus = Database['public']['Enums']['channel_status']
export type WebtoonEpisodePricing = 'free' | 'paid'
export type WebtoonEpisodeStatus = Database['public']['Enums']['episode_status']
export type WorkScale = 'short' | 'medium' | 'long'

export interface WebtoonEpisodeImageRecord {
  imageUrl: string
  originalImageUrl?: string | null
  optimizedImageUrl?: string | null
  thumbnailImageUrl?: string | null
  sortOrder: number
  width?: number | null
  height?: number | null
  fileSizeBytes?: number | null
  contentType?: string | null
  derivatives?: Json | null
  isVerified?: boolean
  processingStatus?: string | null
  processingError?: string | null
  cleanupStatus?: string | null
  originalFilePath?: string | null
  optimizedFilePath?: string | null
  thumbnailFilePath?: string | null
}

export interface CreatorWebtoonEpisodeRecord {
  id: string
  episodeNumber: number
  title: string
  pricingType: WebtoonEpisodePricing
  coinPrice: number
  isAdultOnly: boolean
  status: WebtoonEpisodeStatus
  publishedAt: string | null
  images: WebtoonEpisodeImageRecord[]
}

export interface CreatorWebtoonRecord {
  id: string
  title: string
  description: string
  coverImageUrl: string | null
  ageRating: ChannelAgeRating
  ratingChecklist: RatingChecklist
  isAdultOnly: boolean
  isCommentEnabled: boolean
  commentPolicyNote: string | null
  status: WebtoonStatus
  totalEpisodes: number
  workScale: WorkScale
  teaserPercentage: number
  isFreeArchive: boolean
  serializationDays: number[]
  category: string
  tags: string[]
  creatorName: string
  updatedAt: string
  episodes: CreatorWebtoonEpisodeRecord[]
}

export interface CreatorWebtoonListItem {
  id: string
  title: string
  coverImageUrl: string | null
  ageRating: ChannelAgeRating
  status: WebtoonStatus
  category: string
  tags: string[]
  episodeCount: number
  updatedAt: string
}

export interface WebtoonDraftInput {
  title: string
  description: string
  coverImageUrl: string | null
  ageRating: ChannelAgeRating
  ratingChecklist: RatingChecklist
  isAdultOnly: boolean
  isCommentEnabled: boolean
  commentPolicyNote: string | null
  status: WebtoonStatus
  workScale: WorkScale
  teaserPercentage: number
  isFreeArchive: boolean
  serializationDays: number[]
  category: string
  tags: string[]
}

export interface WebtoonEpisodeDraftInput {
  title: string
  episodeNumber: number
  pricingType: WebtoonEpisodePricing
  coinPrice: number
  status: WebtoonEpisodeStatus
  images: WebtoonEpisodeImageRecord[]
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const
export const FLEXIBLE_SERIALIZATION_LABEL = '자율'

export function sanitizeWebtoonTags(value: string) {
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

export function parseSerializationDays(value: Json) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (typeof entry === 'number' && Number.isInteger(entry) && entry >= 0 && entry <= 6) {
        return entry
      }

      return null
    })
    .filter((entry): entry is number => entry !== null)
}

export function getWebtoonStatusLabel(status: WebtoonStatus) {
  switch (status) {
    case 'draft':
      return '초안'
    case 'publishing':
      return '공개 중'
    case 'completed':
      return '완결'
    case 'suspended':
      return '중지'
    default:
      return status
  }
}

export function getAgeRatingLabel(rating: ChannelAgeRating) {
  return getSharedAgeRatingLabel(rating)
}

export function getEpisodePricingLabel(pricingType: WebtoonEpisodePricing) {
  switch (pricingType) {
    case 'free':
      return '무료'
    case 'paid':
      return '구독 공개'
    default:
      return pricingType
  }
}

export function getWorkScaleLabel(workScale: WorkScale) {
  switch (workScale) {
    case 'short':
      return '단편'
    case 'medium':
      return '중편'
    case 'long':
      return '장편'
    default:
      return workScale
  }
}

export function getEpisodeStatusLabel(status: WebtoonEpisodeStatus) {
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

export function getSerializationDayLabel(day: number) {
  return WEEKDAY_LABELS[day] ?? `${day}`
}

export function getSerializationScheduleLabel(days: number[]) {
  if (days.length === 0) {
    return FLEXIBLE_SERIALIZATION_LABEL
  }

  return days.map(getSerializationDayLabel).join(', ')
}

export function getPayoutMethodLabel(
  method: Database['public']['Enums']['payout_method']
) {
  switch (method) {
    case 'bank_transfer':
      return '계좌 이체'
    case 'paypal':
      return 'PayPal'
    default:
      return method
  }
}
