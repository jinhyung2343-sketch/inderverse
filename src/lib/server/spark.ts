import 'server-only'

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { SparkRecord, SparkStatus } from '@/lib/spark'
import { getSparkPanelCount, parseSparkMeta } from '@/lib/spark'
import type { Database } from '@/lib/supabase/types'

type ChannelRow = Database['public']['Tables']['channels']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

interface SparkChannelQueryRow
  extends Pick<
    ChannelRow,
    | 'id'
    | 'title'
    | 'description'
    | 'cover_image_url'
    | 'is_adult_only'
    | 'status'
    | 'spark_caption'
    | 'spark_format'
    | 'spark_panel_count'
    | 'spark_meta'
    | 'created_at'
    | 'updated_at'
  > {
  creator?: Pick<ProfileRow, 'display_name'> | null
}

export interface SparkDetailContext {
  spark: SparkRecord
  previousSpark: SparkRecord | null
  nextSpark: SparkRecord | null
  relatedSparks: SparkRecord[]
  engagement: SparkEngagementSummary
}

export interface SparkEngagementSummary {
  viewCount: number
  applauseCount: number
  saveCount: number
  viewerHasSaved: boolean
  viewerCanSave: boolean
}

function mapSparkRow(row: SparkChannelQueryRow): SparkRecord {
  const meta = parseSparkMeta(row.spark_meta)
  const format = row.spark_format ?? 'single_cut'

  return {
    id: row.id,
    title: row.title,
    creatorName: row.creator?.display_name?.trim() || '작가',
    format,
    panelCount: row.spark_panel_count ?? getSparkPanelCount(format),
    topic: meta.topic || '스파크',
    caption: row.spark_caption?.trim() || '짧고 선명한 시선으로 지금의 장면을 붙잡습니다.',
    summary: row.description?.trim() || '아직 상세 소개가 입력되지 않은 스파크입니다.',
    description: row.description?.trim() || '아직 상세 소개가 입력되지 않은 스파크입니다.',
    punchline: meta.punchline || '지금 이 장면을 한 번 더 보게 만드는 문장을 준비 중입니다.',
    tags: meta.tags,
    tone: meta.tone,
    externalUrl: meta.externalUrl,
    coverImageUrl: row.cover_image_url?.trim() || null,
    panels: meta.panels,
    isAdultOnly: row.is_adult_only,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const getViewerSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      userId: null,
      isAdultVerified: false,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_adult_verified')
    .eq('id', user.id)
    .single()

  return {
    userId: user.id,
    isAdultVerified: profile?.is_adult_verified ?? false,
  }
})

function getPublicStatuses(): SparkStatus[] {
  return ['publishing', 'completed']
}

export async function getPublicSparkList() {
  const { isAdultVerified } = await getViewerSession()
  const admin = createAdminClient()
  let query = admin
    .from('channels')
    .select(
      `
        id,
        title,
        description,
        cover_image_url,
        is_adult_only,
        status,
        spark_caption,
        spark_format,
        spark_panel_count,
        spark_meta,
        created_at,
        updated_at,
        creator:profiles!channels_creator_id_fkey(display_name)
      `
    )
    .eq('work_type', 'spark')
    .in('status', getPublicStatuses())
    .order('updated_at', { ascending: false })

  if (!isAdultVerified) {
    query = query.eq('is_adult_only', false)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to load spark feed: ${error.message}`)
  }

  return ((data ?? []) as SparkChannelQueryRow[]).map(mapSparkRow)
}

export async function getPublicSparkById(id: string) {
  const { isAdultVerified } = await getViewerSession()
  const admin = createAdminClient()
  let query = admin
    .from('channels')
    .select(
      `
        id,
        title,
        description,
        cover_image_url,
        is_adult_only,
        status,
        spark_caption,
        spark_format,
        spark_panel_count,
        spark_meta,
        created_at,
        updated_at,
        creator:profiles!channels_creator_id_fkey(display_name)
      `
    )
    .eq('id', id)
    .eq('work_type', 'spark')
    .in('status', getPublicStatuses())

  if (!isAdultVerified) {
    query = query.eq('is_adult_only', false)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw new Error(`Failed to load spark detail: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return mapSparkRow(data as SparkChannelQueryRow)
}

export async function getSparkEngagementSummary(channelId: string): Promise<SparkEngagementSummary> {
  const admin = createAdminClient()
  const { userId } = await getViewerSession()

  const [viewsResult, applauseResult, savesResult, viewerSaveResult] = await Promise.all([
    admin
      .from('spark_views')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channelId),
    admin
      .from('spark_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channelId)
      .eq('reaction_type', 'applause'),
    admin
      .from('spark_saves')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channelId),
    userId
      ? admin
          .from('spark_saves')
          .select('id', { head: true, count: 'exact' })
          .eq('channel_id', channelId)
          .eq('user_id', userId)
      : Promise.resolve({ count: 0, error: null }),
  ])

  if (viewsResult.error) {
    throw new Error(`Failed to load spark views: ${viewsResult.error.message}`)
  }

  if (applauseResult.error) {
    throw new Error(`Failed to load spark applause: ${applauseResult.error.message}`)
  }

  if (savesResult.error) {
    throw new Error(`Failed to load spark saves: ${savesResult.error.message}`)
  }

  if (viewerSaveResult.error) {
    throw new Error(`Failed to load spark save state: ${viewerSaveResult.error.message}`)
  }

  return {
    viewCount: viewsResult.count ?? 0,
    applauseCount: applauseResult.count ?? 0,
    saveCount: savesResult.count ?? 0,
    viewerHasSaved: (viewerSaveResult.count ?? 0) > 0,
    viewerCanSave: Boolean(userId),
  }
}

function getSparkSimilarityScore(base: SparkRecord, candidate: SparkRecord) {
  let score = 0

  if (base.topic === candidate.topic) {
    score += 6
  }

  if (base.format === candidate.format) {
    score += 2
  }

  const sharedTags = candidate.tags.filter((tag) => base.tags.includes(tag)).length
  score += sharedTags * 3

  const baseDate = new Date(base.updatedAt).getTime()
  const candidateDate = new Date(candidate.updatedAt).getTime()
  const ageGapHours = Math.abs(baseDate - candidateDate) / (1000 * 60 * 60)

  if (ageGapHours <= 72) {
    score += 1
  }

  return score
}

export async function getPublicSparkDetailContext(id: string): Promise<SparkDetailContext | null> {
  const sparks = await getPublicSparkList()
  const currentIndex = sparks.findIndex((spark) => spark.id === id)

  if (currentIndex === -1) {
    return null
  }

  const spark = sparks[currentIndex]
  const previousSpark = currentIndex > 0 ? sparks[currentIndex - 1] : null
  const nextSpark = currentIndex < sparks.length - 1 ? sparks[currentIndex + 1] : null

  const relatedSparks = sparks
    .filter((candidate) => candidate.id !== spark.id)
    .map((candidate) => ({
      candidate,
      score: getSparkSimilarityScore(spark, candidate),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => entry.candidate)

  const engagement = await getSparkEngagementSummary(spark.id)

  return {
    spark,
    previousSpark,
    nextSpark,
    relatedSparks,
    engagement,
  }
}

export async function getCreatorSparkList() {
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
      `
        id,
        title,
        description,
        cover_image_url,
        is_adult_only,
        status,
        spark_caption,
        spark_format,
        spark_panel_count,
        spark_meta,
        created_at,
        updated_at
      `
    )
    .eq('creator_id', user.id)
    .eq('work_type', 'spark')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load creator spark list: ${error.message}`)
  }

  return ((data ?? []) as Omit<SparkChannelQueryRow, 'creator'>[]).map((row) =>
    mapSparkRow({
      ...row,
      creator: null,
    })
  )
}

export async function getCreatorSparkById(id: string) {
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
      `
        id,
        title,
        description,
        cover_image_url,
        is_adult_only,
        status,
        spark_caption,
        spark_format,
        spark_panel_count,
        spark_meta,
        created_at,
        updated_at
      `
    )
    .eq('id', id)
    .eq('creator_id', user.id)
    .eq('work_type', 'spark')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load creator spark detail: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return mapSparkRow({
    ...(data as Omit<SparkChannelQueryRow, 'creator'>),
    creator: null,
  })
}

export async function getSavedSparkList() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: saves, error: savesError } = await supabase
    .from('spark_saves')
    .select('channel_id, saved_at')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  if (savesError) {
    throw new Error(`Failed to load saved spark ids: ${savesError.message}`)
  }

  const channelIds = (saves ?? []).map((save) => save.channel_id)

  if (channelIds.length === 0) {
    return []
  }

  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select(
      `
        id,
        title,
        description,
        cover_image_url,
        is_adult_only,
        status,
        spark_caption,
        spark_format,
        spark_panel_count,
        spark_meta,
        created_at,
        updated_at
      `
    )
    .in('id', channelIds)
    .eq('work_type', 'spark')

  if (channelsError) {
    throw new Error(`Failed to load saved sparks: ${channelsError.message}`)
  }

  const sparkById = new Map(
    ((channels ?? []) as Omit<SparkChannelQueryRow, 'creator'>[]).map((row) => [
      row.id,
      mapSparkRow({
        ...row,
        creator: null,
      }),
    ])
  )

  return channelIds
    .map((channelId) => sparkById.get(channelId))
    .filter((spark): spark is SparkRecord => Boolean(spark))
}
