import type { Json } from '@/lib/supabase/types'

export type ChannelAgeRating = 'all' | '12' | '15' | '19'
export type RatingIntensity = 'none' | 'low' | 'medium' | 'high'

export interface RatingChecklist {
  sexualContent: RatingIntensity
  violence: RatingIntensity
  language: RatingIntensity
}

export const DEFAULT_RATING_CHECKLIST: RatingChecklist = {
  sexualContent: 'none',
  violence: 'none',
  language: 'none',
}

export const AGE_RATING_OPTIONS: Array<{
  value: ChannelAgeRating
  label: string
  description: string
}> = [
  {
    value: 'all',
    label: '전체',
    description: '대부분의 이용자가 무리 없이 볼 수 있는 수준입니다.',
  },
  {
    value: '12',
    label: '12세',
    description: '가벼운 긴장감이나 제한적인 수위 표현이 포함될 수 있습니다.',
  },
  {
    value: '15',
    label: '15세',
    description: '상대적으로 강한 주제, 폭력, 언어 표현이 들어갈 수 있습니다.',
  },
  {
    value: '19',
    label: '19세',
    description: '성인 인증이 필요한 작품으로 분류되고 법적 책임 안내가 함께 적용됩니다.',
  },
]

export const RATING_INTENSITY_OPTIONS: Array<{
  value: RatingIntensity
  label: string
}> = [
  { value: 'none', label: '없음' },
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '보통' },
  { value: 'high', label: '높음' },
]

const AGE_RATING_ORDER: Record<ChannelAgeRating, number> = {
  all: 0,
  '12': 1,
  '15': 2,
  '19': 3,
}

export function isChannelAgeRating(value: string): value is ChannelAgeRating {
  return value === 'all' || value === '12' || value === '15' || value === '19'
}

function isRatingIntensity(value: unknown): value is RatingIntensity {
  return value === 'none' || value === 'low' || value === 'medium' || value === 'high'
}

export function getAgeRatingLabel(rating: ChannelAgeRating) {
  return AGE_RATING_OPTIONS.find((option) => option.value === rating)?.label ?? rating
}

export function sanitizeRatingChecklist(value: unknown): RatingChecklist {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_RATING_CHECKLIST
  }

  const objectValue = value as Record<string, unknown>

  return {
    sexualContent: isRatingIntensity(objectValue.sexualContent)
      ? objectValue.sexualContent
      : DEFAULT_RATING_CHECKLIST.sexualContent,
    violence: isRatingIntensity(objectValue.violence)
      ? objectValue.violence
      : DEFAULT_RATING_CHECKLIST.violence,
    language: isRatingIntensity(objectValue.language)
      ? objectValue.language
      : DEFAULT_RATING_CHECKLIST.language,
  }
}

export function parseRatingChecklist(value: Json | null | undefined) {
  return sanitizeRatingChecklist(value)
}

export function buildRatingChecklistJson(checklist: RatingChecklist): Json {
  return {
    sexualContent: checklist.sexualContent,
    violence: checklist.violence,
    language: checklist.language,
  }
}

export function getSuggestedAgeRating(checklist: RatingChecklist): ChannelAgeRating {
  const levels = Object.values(checklist)

  if (levels.some((level) => level === 'high')) {
    return '19'
  }

  if (levels.some((level) => level === 'medium')) {
    return '15'
  }

  if (levels.some((level) => level === 'low')) {
    return '12'
  }

  return 'all'
}

export function isAgeRatingAtLeast(selected: ChannelAgeRating, minimum: ChannelAgeRating) {
  return AGE_RATING_ORDER[selected] >= AGE_RATING_ORDER[minimum]
}
