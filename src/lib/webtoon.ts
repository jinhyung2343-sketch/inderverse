import type { Json, Database } from '@/lib/supabase/types'

export type WebtoonStatus = Database['public']['Enums']['channel_status']
export type WebtoonEpisodePricing = Database['public']['Enums']['episode_pricing']
export type WebtoonEpisodeStatus = Database['public']['Enums']['episode_status']

export interface WebtoonEpisodeImageRecord {
  imageUrl: string
  sortOrder: number
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
  isAdultOnly: boolean
  isCommentEnabled: boolean
  commentPolicyNote: string | null
  status: WebtoonStatus
  waitFreeHours: number
  serializationDays: number[]
  category: string
  tags: string[]
  creatorName: string
  updatedAt: string
  episodes: CreatorWebtoonEpisodeRecord[]
  revenueSettings: {
    creatorSharePct: number
    minPayoutAmount: number
    payoutMethod: Database['public']['Enums']['payout_method'] | null
  }
}

export interface CreatorWebtoonListItem {
  id: string
  title: string
  coverImageUrl: string | null
  status: WebtoonStatus
  category: string
  tags: string[]
  episodeCount: number
  updatedAt: string
  revenueSettings: {
    creatorSharePct: number
    minPayoutAmount: number
    payoutMethod: Database['public']['Enums']['payout_method'] | null
  }
}

export interface WebtoonDraftInput {
  title: string
  description: string
  coverImageUrl: string | null
  isAdultOnly: boolean
  isCommentEnabled: boolean
  commentPolicyNote: string | null
  status: WebtoonStatus
  waitFreeHours: number
  serializationDays: number[]
  category: string
  tags: string[]
  revenueSettings: {
    creatorSharePct: number
    minPayoutAmount: number
    payoutMethod: Database['public']['Enums']['payout_method'] | null
  }
}

export interface WebtoonEpisodeDraftInput {
  title: string
  episodeNumber: number
  pricingType: WebtoonEpisodePricing
  coinPrice: number
  isAdultOnly: boolean
  status: WebtoonEpisodeStatus
  images: WebtoonEpisodeImageRecord[]
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

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

export function getEpisodePricingLabel(pricingType: WebtoonEpisodePricing) {
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
