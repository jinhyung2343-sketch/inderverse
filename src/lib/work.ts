import type { Database } from '@/lib/supabase/types'

export type WorkType = Database['public']['Enums']['work_type']
export type WorkStatus = Database['public']['Enums']['channel_status']
export type WorkItemPricing = Database['public']['Enums']['episode_pricing']
export type WorkItemStatus = Database['public']['Enums']['episode_status']

export const WORK_TYPES = [
  'webtoon',
  'novel',
  'audio_drama',
  'music',
  'illustration',
  'essay',
  'other',
  'spark',
] as const satisfies readonly WorkType[]

export const ALPHA_WORK_TYPES = ['webtoon', 'novel'] as const satisfies readonly WorkType[]

export interface CreatorChannelRecord {
  id: string
  ownerId: string
  slug: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  coverImageUrl: string | null
  externalLinks: CreatorChannelExternalLink[]
  status: 'draft' | 'active' | 'suspended'
}

export interface CreatorChannelExternalLink {
  label: string
  url: string
}

export interface WorkRecord {
  id: string
  creatorId: string
  creatorChannelId: string | null
  workType: WorkType
  title: string
  description: string
  coverImageUrl: string | null
  status: WorkStatus
  isAdultOnly: boolean
  updatedAt: string
}

export interface WorkItemRecord {
  id: string
  workId: string
  itemNumber: number
  title: string
  pricingType: WorkItemPricing
  coinPrice: number
  status: WorkItemStatus
  publishedAt: string | null
}

export function isWorkType(value: string): value is WorkType {
  return (WORK_TYPES as readonly string[]).includes(value)
}

export function getWorkTypeLabel(workType: WorkType) {
  switch (workType) {
    case 'webtoon':
      return '웹툰'
    case 'novel':
      return '웹소설'
    case 'audio_drama':
      return '오디오 드라마'
    case 'music':
      return '음악'
    case 'illustration':
      return '일러스트'
    case 'essay':
      return '에세이'
    case 'spark':
      return '스파크'
    case 'other':
      return '기타'
    default:
      return workType
  }
}

export function isAlphaWorkType(workType: WorkType) {
  return (ALPHA_WORK_TYPES as readonly string[]).includes(workType)
}
