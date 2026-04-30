import 'server-only'

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
    isAdultOnly: row.is_adult_only,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getViewerAdultVerified() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_adult_verified')
    .eq('id', user.id)
    .single()

  return profile?.is_adult_verified ?? false
}

function getPublicStatuses(): SparkStatus[] {
  return ['publishing', 'completed']
}

export async function getPublicSparkList() {
  const isAdultVerified = await getViewerAdultVerified()
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
  const isAdultVerified = await getViewerAdultVerified()
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
