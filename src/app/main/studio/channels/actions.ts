'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SparkDraftInput, SparkFormat, SparkPanel, SparkStatus } from '@/lib/spark'
import { buildSparkMeta, getSparkPanelCount, sanitizeSparkTags } from '@/lib/spark'
import type { Database } from '@/lib/supabase/types'

type UserRole = Database['public']['Enums']['user_role']

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key)
  return value.length > 0 ? value : null
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

function parsePanels(value: string, format: SparkFormat, status: SparkStatus) {
  if (!value) {
    if (status === 'draft') {
      return []
    }

    throw new Error('공개 스파크에는 패널 이미지가 필요합니다.')
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('패널 데이터 형식이 올바르지 않습니다.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('패널 데이터 형식이 올바르지 않습니다.')
  }

  const sanitizedPanels = parsed
    .map((panel) => {
      if (!panel || typeof panel !== 'object') {
        return null
      }

      const imageUrl = typeof panel.imageUrl === 'string' ? panel.imageUrl.trim() : ''
      const caption = typeof panel.caption === 'string' ? panel.caption.trim() : ''

      if (!imageUrl && !caption) {
        return null
      }

      return {
        imageUrl,
        caption,
      }
    })
    .filter((panel): panel is SparkPanel => panel !== null)

  const requiredPanelCount = getSparkPanelCount(format)
  const activePanels = sanitizedPanels.slice(0, requiredPanelCount)

  if (status !== 'draft' && activePanels.length < requiredPanelCount) {
    throw new Error(`현재 포맷에는 최소 ${requiredPanelCount}개의 패널 이미지가 필요합니다.`)
  }

  if (status !== 'draft' && activePanels.some((panel) => !panel.imageUrl)) {
    throw new Error('공개 스파크의 각 패널에는 이미지가 필요합니다.')
  }

  return activePanels
}

function isSparkFormat(value: string): value is SparkFormat {
  return value === 'single_cut' || value === 'four_cut'
}

function isSparkStatus(value: string): value is SparkStatus {
  return value === 'draft' || value === 'publishing' || value === 'completed' || value === 'suspended'
}

async function requireCreatorAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as UserRole | undefined

  if (role !== 'creator' && role !== 'admin') {
    redirect('/main?denied=creator')
  }

  return { supabase, userId: user.id }
}

function parseSparkDraft(formData: FormData): SparkDraftInput {
  const title = readText(formData, 'title')
  const description = readText(formData, 'description')
  const caption = readText(formData, 'caption')
  const topic = readText(formData, 'topic')
  const punchline = readText(formData, 'punchline')
  const formatValue = readText(formData, 'format')
  const statusValue = readText(formData, 'status')
  const panelsJson = readText(formData, 'panelsJson')

  if (!title || !description || !caption || !topic || !punchline) {
    throw new Error('필수 항목이 비어 있습니다.')
  }

  if (!isSparkFormat(formatValue)) {
    throw new Error('유효하지 않은 스파크 포맷입니다.')
  }

  if (!isSparkStatus(statusValue)) {
    throw new Error('유효하지 않은 공개 상태입니다.')
  }

  const panels = parsePanels(panelsJson, formatValue, statusValue)

  return {
    title,
    description,
    coverImageUrl: readOptionalText(formData, 'coverImageUrl'),
    isAdultOnly: readBoolean(formData, 'isAdultOnly'),
    status: statusValue,
    format: formatValue,
    caption,
    topic,
    punchline,
    tags: sanitizeSparkTags(readText(formData, 'tags')),
    tone: readOptionalText(formData, 'tone'),
    externalUrl: readOptionalText(formData, 'externalUrl'),
    panels,
  }
}

function buildSparkChannelPayload(input: SparkDraftInput, creatorId: string) {
  return {
    creator_id: creatorId,
    title: input.title,
    description: input.description,
    cover_image_url: input.coverImageUrl,
    is_adult_only: input.isAdultOnly,
    status: input.status,
    work_type: 'spark' as const,
    spark_format: input.format,
    spark_panel_count: getSparkPanelCount(input.format),
    spark_caption: input.caption,
    spark_meta: buildSparkMeta(input),
    serialization_days: [],
    wait_free_hours: 0,
  }
}

export async function createSparkChannel(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const input = parseSparkDraft(formData)
  const payload = buildSparkChannelPayload(input, userId)

  const { data, error } = await supabase
    .from('channels')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(error?.message || '스파크를 만들지 못했습니다.')
  }

  const { error: revenueError } = await supabase
    .from('revenue_settings')
    .upsert({ channel_id: data.id }, { onConflict: 'channel_id' })

  if (revenueError) {
    throw new Error(revenueError.message)
  }

  revalidatePath('/main/spark')
  revalidatePath('/main/studio/channels')
  redirect(`/main/studio/channels/spark/${data.id}/edit`)
}

export async function updateSparkChannel(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const channelId = readText(formData, 'channelId')

  if (!channelId) {
    throw new Error('수정 대상 스파크를 찾지 못했습니다.')
  }

  const input = parseSparkDraft(formData)
  const payload = buildSparkChannelPayload(input, userId)

  const { error } = await supabase
    .from('channels')
    .update(payload)
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', 'spark')

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/main/spark')
  revalidatePath(`/main/spark/${channelId}`)
  revalidatePath('/main/studio/channels')
  redirect(`/main/studio/channels/spark/${channelId}/edit`)
}
