import type { Database, Json } from '@/lib/supabase/types'
import { getAgeRatingLabel as getSharedAgeRatingLabel } from '@/lib/content-rating'
import type { ChannelAgeRating, RatingChecklist } from '@/lib/content-rating'

export type SparkFormat = Database['public']['Enums']['spark_format']
export type SparkStatus = Database['public']['Enums']['channel_status']

export interface SparkPanel {
  imageUrl: string
  caption: string
}

export interface SparkMeta {
  topic: string
  tags: string[]
  punchline: string
  tone: string | null
  externalUrl: string | null
  panels: SparkPanel[]
}

export interface SparkRecord {
  id: string
  title: string
  creatorName: string
  format: SparkFormat
  panelCount: number
  topic: string
  caption: string
  summary: string
  description: string
  ageRating: ChannelAgeRating
  ratingChecklist: RatingChecklist
  punchline: string
  tags: string[]
  tone: string | null
  externalUrl: string | null
  coverImageUrl: string | null
  panels: SparkPanel[]
  isAdultOnly: boolean
  status: SparkStatus
  createdAt: string
  updatedAt: string
}

export interface SparkDraftInput {
  title: string
  description: string
  coverImageUrl: string | null
  ageRating: ChannelAgeRating
  ratingChecklist: RatingChecklist
  isAdultOnly: boolean
  status: SparkStatus
  format: SparkFormat
  caption: string
  topic: string
  punchline: string
  tags: string[]
  tone: string | null
  externalUrl: string | null
  panels: SparkPanel[]
}

function asObject(value: Json): Record<string, Json | undefined> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, Json | undefined>
  }

  return null
}

function asString(value: Json | undefined) {
  return typeof value === 'string' ? value.trim() : ''
}

function asStringArray(value: Json | undefined) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function parseSparkPanels(value: Json | undefined) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      const objectValue = asObject(entry)

      if (!objectValue) {
        return null
      }

      const imageUrl = asString(objectValue.imageUrl)
      const caption = asString(objectValue.caption)

      if (!imageUrl && !caption) {
        return null
      }

      return {
        imageUrl,
        caption,
      }
    })
    .filter((entry): entry is SparkPanel => entry !== null)
}

export function sanitizeSparkTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 8)
    )
  )
}

export function parseSparkMeta(value: Json): SparkMeta {
  const objectValue = asObject(value)

  if (!objectValue) {
    return {
      topic: '',
      tags: [],
      punchline: '',
      tone: null,
      externalUrl: null,
      panels: [],
    }
  }

  const topic = asString(objectValue.topic)
  const tags = asStringArray(objectValue.tags)
  const punchline = asString(objectValue.punchline)
  const tone = asString(objectValue.tone)
  const externalUrl = asString(objectValue.externalUrl)
  const panels = parseSparkPanels(objectValue.panels)

  return {
    topic,
    tags,
    punchline,
    tone: tone || null,
    externalUrl: externalUrl || null,
    panels,
  }
}

export function buildSparkMeta(input: SparkDraftInput): Json {
  return {
    topic: input.topic.trim(),
    tags: input.tags,
    punchline: input.punchline.trim(),
    tone: input.tone?.trim() || null,
    externalUrl: input.externalUrl?.trim() || null,
    panels: input.panels.map((panel) => ({
      imageUrl: panel.imageUrl.trim(),
      caption: panel.caption.trim(),
    })),
  }
}

export function getSparkPanelCount(format: SparkFormat) {
  return format === 'four_cut' ? 4 : 1
}

export function getSparkFormatLabel(format: SparkFormat) {
  return format === 'four_cut' ? '4컷 스트립' : '단독 컷'
}

export function getSparkStatusLabel(status: SparkStatus) {
  switch (status) {
    case 'draft':
      return '초안'
    case 'publishing':
      return '공개 중'
    case 'completed':
      return '아카이브'
    case 'suspended':
      return '중지'
    default:
      return status
  }
}

export function getAgeRatingLabel(rating: ChannelAgeRating) {
  return getSharedAgeRatingLabel(rating)
}

export function getSparkAccentClassName(record: Pick<SparkRecord, 'topic' | 'format' | 'tags' | 'isAdultOnly'>) {
  const keywords = [record.topic, ...record.tags].join(' ').toLowerCase()

  if (record.isAdultOnly) {
    return 'from-rose-500/30 via-red-500/10 to-transparent'
  }

  if (keywords.includes('정치') || keywords.includes('브리핑')) {
    return 'from-sky-500/30 via-cyan-500/10 to-transparent'
  }

  if (keywords.includes('사회') || keywords.includes('이슈') || keywords.includes('풍자')) {
    return 'from-amber-500/30 via-orange-500/10 to-transparent'
  }

  if (keywords.includes('인물') || keywords.includes('패러디')) {
    return 'from-rose-500/30 via-fuchsia-500/10 to-transparent'
  }

  return record.format === 'four_cut'
    ? 'from-emerald-500/30 via-teal-500/10 to-transparent'
    : 'from-indigo-500/30 via-violet-500/10 to-transparent'
}
