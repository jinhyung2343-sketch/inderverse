'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { getBottegaHref, isReadyBottegaWorkType } from '@/lib/bottega'
import {
  buildRatingChecklistJson,
  getAgeRatingLabel,
  getSuggestedAgeRating,
  isAgeRatingAtLeast,
  isChannelAgeRating,
  sanitizeRatingChecklist,
} from '@/lib/content-rating'
import {
  uploadChannelCoverFile,
  uploadEpisodeImageFile,
  uploadSparkCoverFile,
  uploadSparkPanelFile,
} from '@/lib/storage/upload'
import { mapWithConcurrency } from '@/lib/server/concurrency'
import { PUBLIC_CACHE_TAGS } from '@/lib/public-cache'
import { ensureDefaultCreatorChannel } from '@/lib/server/creator-channels'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { SparkDraftInput, SparkFormat, SparkPanel, SparkStatus } from '@/lib/spark'
import { buildSparkMeta, getSparkPanelCount, sanitizeSparkTags } from '@/lib/spark'
import { isWorkType } from '@/lib/work'
import { isValidWorkDraftKey, isWorkDraftType } from '@/lib/work-drafts'
import type {
  NovelDraftInput,
  NovelEpisodeDraftInput,
  NovelEpisodePricing,
  NovelEpisodeStatus,
} from '@/lib/novel'
import { sanitizeNovelTags } from '@/lib/novel'
import type {
  WebtoonDraftInput,
  WebtoonEpisodeDraftInput,
  WebtoonEpisodePricing,
  WebtoonEpisodeStatus,
} from '@/lib/webtoon'
import { sanitizeWebtoonTags } from '@/lib/webtoon'
import type { Database, Json } from '@/lib/supabase/types'

type UserRole = Database['public']['Enums']['user_role']
type WorkType = Database['public']['Enums']['work_type']

const WEBTOON_EPISODE_CREATE_UPLOAD_CONCURRENCY = 2

export interface WebtoonChannelActionState {
  error: string | null
}

export interface ContentRatingActionState {
  error: string | null
}

export interface DeleteToonWorkActionState {
  error: string | null
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function revalidatePublicContentCache() {
  revalidateTag(PUBLIC_CACHE_TAGS.artworks, 'max')
  revalidateTag(PUBLIC_CACHE_TAGS.creators, 'max')
  revalidateTag(PUBLIC_CACHE_TAGS.navigation, 'max')
  revalidateTag(PUBLIC_CACHE_TAGS.sparks, 'max')
}

export async function selectPrimaryBottega(formData: FormData) {
  const workType = readText(formData, 'workType')

  if (!isReadyBottegaWorkType(workType)) {
    redirect('/main/studio/channels')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt?next=/main/studio/channels')
  }

  const creatorChannel = await ensureDefaultCreatorChannel(user.id)
  const selectedWorkType = workType as WorkType
  const { error } = await supabase
    .from('creator_channels')
    .update({
      primary_work_type: selectedWorkType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', creatorChannel.id)
    .eq('owner_id', user.id)

  if (error) {
    const message = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()

    if (message.includes('primary_work_type')) {
      console.warn('primary_work_type column is not available yet. Apply migration 050_creator_channel_primary_bottega.sql to persist Bottega selection.')
      redirect(getBottegaHref(workType))
    }

    throw new Error(error.message || 'Bottega 장르를 저장하지 못했습니다.')
  }

  revalidatePath('/main/studio')
  revalidatePath('/main/studio/channels')
  revalidatePath('/main/studio/creator-channel')
  redirect(getBottegaHref(workType))
}

async function deleteToonWorkMutation(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const channelId = readText(formData, 'channelId')
  const workType = readText(formData, 'workType')

  if (!channelId) {
    throw new Error('삭제할 작품을 찾지 못했습니다.')
  }

  if (workType !== 'webtoon' && workType !== 'spark') {
    throw new Error('툰 보테가에서 삭제할 수 있는 작품 유형이 아닙니다.')
  }

  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('id')
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', workType)
    .maybeSingle()

  if (channelError) {
    throw new Error(channelError.message)
  }

  if (!channel) {
    throw new Error('내 작품 목록에서 삭제할 작품을 찾지 못했습니다.')
  }

  const { error: deleteError } = await supabase
    .from('channels')
    .delete()
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', workType)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  revalidatePath('/main/studio')
  revalidatePath('/main/studio/channels')
  revalidatePath('/main/studio/channels/webtoon')
  revalidatePath(`/main/studio/channels/${workType}/${channelId}/edit`)
  revalidatePath(`/main/studio/channels/${workType}/${channelId}/rating`)
  revalidatePath('/main/explore')
  revalidatePath(`/main/explore/${channelId}`)
  revalidatePath('/main/spark')
  revalidatePath(`/main/spark/${channelId}`)
  revalidatePublicContentCache()

  return '/main/studio/channels/webtoon?deleted=1'
}

export async function deleteToonWorkWithState(
  _previousState: DeleteToonWorkActionState,
  formData: FormData
): Promise<DeleteToonWorkActionState> {
  let nextPath: string

  try {
    nextPath = await deleteToonWorkMutation(formData)
  } catch (error) {
    console.error('deleteToonWork failed:', error)
    return {
      error: getActionErrorMessage(error, '작품을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
    }
  }

  redirect(nextPath)
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key)
  return value.length > 0 ? value : null
}

function readOptionalAssetUrl(formData: FormData, key: string) {
  const value = readOptionalText(formData, key)

  if (!value || value.startsWith('blob:')) {
    return null
  }

  return value
}

function readCoverImageIntent(formData: FormData) {
  const value = readText(formData, 'coverImageIntent')

  return value === 'set' || value === 'clear' ? value : 'keep'
}

function appendLocalDraftClearParam(path: string, formData: FormData) {
  const draftStorageKey = readText(formData, 'draftStorageKey')

  if (!draftStorageKey.startsWith('inderverse:webtoon-channel-draft:')) {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'

  return `${path}${separator}clearDraftKey=${encodeURIComponent(draftStorageKey)}`
}

async function deleteServerWorkDraft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData
) {
  const draftType = readText(formData, 'serverDraftType')
  const draftKey = readText(formData, 'serverDraftKey')

  if (!isWorkDraftType(draftType) || !isValidWorkDraftKey(draftKey)) {
    return
  }

  const { error } = await supabase
    .from('creator_work_drafts')
    .delete()
    .eq('owner_id', userId)
    .eq('draft_type', draftType)
    .eq('draft_key', draftKey)

  if (error) {
    console.warn('Failed to delete saved work draft:', error.message)
  }
}

async function syncChannelEpisodeAdultVisibility({
  channelId,
  isAdultOnly,
  supabase,
  workType,
}: {
  channelId: string
  isAdultOnly: boolean
  supabase: Awaited<ReturnType<typeof createClient>>
  workType: string
}) {
  if (workType !== 'webtoon' && workType !== 'novel') {
    return
  }

  const { error } = await supabase
    .from('episodes')
    .update({ is_adult_only: isAdultOnly })
    .eq('channel_id', channelId)

  if (error) {
    throw new Error(error.message)
  }
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

function readInteger(formData: FormData, key: string, fallback = 0) {
  const value = readText(formData, key)

  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isInteger(parsed)) {
    throw new Error(`${key} 값이 올바르지 않습니다.`)
  }

  return parsed
}

function readOptionalImageFile(formData: FormData, key: string) {
  const value = formData.get(key)

  if (!(value instanceof File) || value.size === 0) {
    return null
  }

  return value
}

function readImageFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0)
}

function parsePanels(
  value: string,
  format: SparkFormat,
  status: SparkStatus,
  pendingUploadCount = 0
) {
  if (!value) {
    if (status === 'draft' || pendingUploadCount > 0) {
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
    .map((panel, index) => {
      if (!panel || typeof panel !== 'object') {
        return null
      }

      const rawImageUrl = typeof panel.imageUrl === 'string' ? panel.imageUrl.trim() : ''
      const imageUrl = rawImageUrl.startsWith('blob:') ? '' : rawImageUrl
      const caption = typeof panel.caption === 'string' ? panel.caption.trim() : ''
      const hasPendingImage = rawImageUrl.startsWith('blob:') || index < pendingUploadCount

      if (!imageUrl && !caption && !hasPendingImage) {
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

  const availableImageCount = activePanels.filter((panel) => panel.imageUrl).length + pendingUploadCount

  if (status !== 'draft' && availableImageCount < requiredPanelCount) {
    throw new Error(`현재 포맷에는 최소 ${requiredPanelCount}개의 패널 이미지가 필요합니다.`)
  }

  if (
    status !== 'draft' &&
    activePanels.some((panel, index) => !panel.imageUrl && index >= pendingUploadCount)
  ) {
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

function isWebtoonStatus(value: string): value is Database['public']['Enums']['channel_status'] {
  return value === 'draft' || value === 'publishing' || value === 'completed' || value === 'suspended'
}

function isEpisodePricing(value: string): value is WebtoonEpisodePricing {
  return value === 'free' || value === 'paid'
}

function isEpisodeStatus(value: string): value is WebtoonEpisodeStatus {
  return value === 'draft' || value === 'published' || value === 'hidden'
}

function normalizeImageProcessingStatus(value: unknown) {
  return value === 'pending' ||
    value === 'processing' ||
    value === 'ready' ||
    value === 'partial' ||
    value === 'failed' ||
    value === 'retry_needed'
    ? value
    : 'ready'
}

function normalizeImageCleanupStatus(value: unknown) {
  return value === 'active' || value === 'orphan_candidate' || value === 'deleted'
    ? value
    : 'active'
}

function readJsonText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function isNovelEpisodePricing(value: string): value is NovelEpisodePricing {
  return value === 'free' || value === 'paid'
}

function isWorkScale(value: string): value is 'short' | 'medium' | 'long' {
  return value === 'short' || value === 'medium' || value === 'long'
}

function isNovelEpisodeStatus(value: string): value is NovelEpisodeStatus {
  return value === 'draft' || value === 'published' || value === 'hidden'
}

function parseChannelContentRating(formData: FormData) {
  const ageRatingValue = readText(formData, 'ageRating') || 'all'
  const ratingChecklistJson = readText(formData, 'ratingChecklistJson')
  const adultContentNoticeAccepted = readText(formData, 'adultContentNoticeAccepted') === 'on'

  if (!isChannelAgeRating(ageRatingValue)) {
    throw new Error('유효하지 않은 연령 등급입니다.')
  }

  let parsedChecklist: unknown = {}

  if (ratingChecklistJson) {
    try {
      parsedChecklist = JSON.parse(ratingChecklistJson)
    } catch {
      throw new Error('등급 체크리스트 형식이 올바르지 않습니다.')
    }
  }

  const ratingChecklist = sanitizeRatingChecklist(parsedChecklist)
  const suggestedAgeRating = getSuggestedAgeRating(ratingChecklist)

  if (!isAgeRatingAtLeast(ageRatingValue, suggestedAgeRating)) {
    throw new Error(
      `현재 체크리스트 기준으로는 최소 ${getAgeRatingLabel(suggestedAgeRating)} 등급이 필요합니다.`
    )
  }

  if (ageRatingValue === '19' && !adultContentNoticeAccepted) {
    throw new Error('19세 이상 작품 안내와 법적 책임 고지를 먼저 확인해 주세요.')
  }

  return {
    ageRating: ageRatingValue,
    ratingChecklist,
    isAdultOnly: ageRatingValue === '19',
  }
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

function readSerializationDays(formData: FormData) {
  const values = formData
    .getAll('serializationDays')
    .map((value) => (typeof value === 'string' ? Number.parseInt(value, 10) : NaN))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)

  return Array.from(new Set(values)).sort((left, right) => left - right)
}

function parseEpisodeImages(value: string, status: WebtoonEpisodeStatus, pendingUploadCount = 0) {
  if (!value) {
    if (status === 'published' && pendingUploadCount === 0) {
      throw new Error('공개 회차에는 최소 1장의 이미지가 필요합니다.')
    }

    return []
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('회차 이미지 데이터 형식이 올바르지 않습니다.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('회차 이미지 데이터 형식이 올바르지 않습니다.')
  }

  const images = parsed
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const rawImageUrl = typeof entry.imageUrl === 'string' ? entry.imageUrl.trim() : ''
      const imageUrl = rawImageUrl.startsWith('blob:') ? '' : rawImageUrl
      const originalImageUrl =
        typeof entry.originalImageUrl === 'string' && !entry.originalImageUrl.startsWith('blob:')
          ? entry.originalImageUrl.trim()
          : null
      const optimizedImageUrl =
        typeof entry.optimizedImageUrl === 'string' && !entry.optimizedImageUrl.startsWith('blob:')
          ? entry.optimizedImageUrl.trim()
          : null
      const thumbnailImageUrl =
        typeof entry.thumbnailImageUrl === 'string' && !entry.thumbnailImageUrl.startsWith('blob:')
          ? entry.thumbnailImageUrl.trim()
          : null
      const sortOrder =
        typeof entry.sortOrder === 'number' && Number.isInteger(entry.sortOrder)
          ? entry.sortOrder
          : index
      const width = typeof entry.width === 'number' && Number.isInteger(entry.width) ? entry.width : null
      const height = typeof entry.height === 'number' && Number.isInteger(entry.height) ? entry.height : null
      const fileSizeBytes =
        typeof entry.fileSizeBytes === 'number' && Number.isInteger(entry.fileSizeBytes) ? entry.fileSizeBytes : null
      const contentType = typeof entry.contentType === 'string' ? entry.contentType.trim() || null : null
      const derivatives = entry.derivatives && typeof entry.derivatives === 'object' ? entry.derivatives : null
      const isVerified = typeof entry.isVerified === 'boolean' ? entry.isVerified : false
      const processingStatus = normalizeImageProcessingStatus(entry.processingStatus)
      const processingError = readJsonText(entry.processingError)
      const cleanupStatus = normalizeImageCleanupStatus(entry.cleanupStatus)
      const originalFilePath = readJsonText(entry.originalFilePath)
      const optimizedFilePath = readJsonText(entry.optimizedFilePath)
      const thumbnailFilePath = readJsonText(entry.thumbnailFilePath)

      if (!imageUrl) {
        return null
      }

      return {
        imageUrl,
        originalImageUrl,
        optimizedImageUrl,
        thumbnailImageUrl,
        sortOrder,
        width,
        height,
        fileSizeBytes,
        contentType,
        derivatives,
        isVerified,
        processingStatus,
        processingError,
        cleanupStatus,
        originalFilePath,
        optimizedFilePath,
        thumbnailFilePath,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((entry, index) => ({
      imageUrl: entry.imageUrl,
      originalImageUrl: entry.originalImageUrl,
      optimizedImageUrl: entry.optimizedImageUrl,
      thumbnailImageUrl: entry.thumbnailImageUrl,
      sortOrder: index,
      width: entry.width,
      height: entry.height,
      fileSizeBytes: entry.fileSizeBytes,
      contentType: entry.contentType,
      derivatives: entry.derivatives,
      isVerified: entry.isVerified,
      processingStatus: entry.processingStatus,
      processingError: entry.processingError,
      cleanupStatus: entry.cleanupStatus,
      originalFilePath: entry.originalFilePath,
      optimizedFilePath: entry.optimizedFilePath,
      thumbnailFilePath: entry.thumbnailFilePath,
    }))

  if (status === 'published' && images.length + pendingUploadCount === 0) {
    throw new Error('공개 회차에는 최소 1장의 이미지가 필요합니다.')
  }

  return images
}

async function syncChannelTags(channelId: string, category: string, tags: string[]) {
  const admin = createAdminClient()
  const desiredNames = Array.from(new Set([category.trim(), ...tags])).filter(Boolean)

  const { data: existingTags, error: existingError } = await admin
    .from('tags')
    .select('id, name')
    .in('name', desiredNames)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const existingByName = new Map((existingTags ?? []).map((tag) => [tag.name, tag.id]))
  const missingNames = desiredNames.filter((name) => !existingByName.has(name))

  if (missingNames.length > 0) {
    const tagRows: Database['public']['Tables']['tags']['Insert'][] = missingNames.map((name) => ({
      name,
      category: name === category ? 'genre' : 'mood',
      is_adult_only: false,
    }))

    const { error: insertTagsError } = await admin.from('tags').insert(
      tagRows
    )

    if (insertTagsError) {
      throw new Error(insertTagsError.message)
    }
  }

  const { data: resolvedTags, error: resolvedError } = await admin
    .from('tags')
    .select('id, name')
    .in('name', desiredNames)

  if (resolvedError) {
    throw new Error(resolvedError.message)
  }

  const desiredTagIds = (resolvedTags ?? []).map((tag) => tag.id)

  const { data: currentTags, error: currentError } = await admin
    .from('channel_tags')
    .select('tag_id')
    .eq('channel_id', channelId)

  if (currentError) {
    throw new Error(currentError.message)
  }

  const currentTagIds = (currentTags ?? []).map((tag) => tag.tag_id)
  const removeTagIds = currentTagIds.filter((id) => !desiredTagIds.includes(id))
  const addTagIds = desiredTagIds.filter((id) => !currentTagIds.includes(id))

  if (removeTagIds.length > 0) {
    const { error: deleteError } = await admin
      .from('channel_tags')
      .delete()
      .eq('channel_id', channelId)
      .in('tag_id', removeTagIds)

    if (deleteError) {
      throw new Error(deleteError.message)
    }
  }

  if (addTagIds.length > 0) {
    const { error: insertError } = await admin
      .from('channel_tags')
      .insert(addTagIds.map((tagId) => ({ channel_id: channelId, tag_id: tagId })))

    if (insertError) {
      throw new Error(insertError.message)
    }
  }
}

async function uploadOptionalChannelCoverFile({
  channelId,
  file,
  context,
}: {
  channelId: string
  file: File
  context: string
}) {
  try {
    return await uploadChannelCoverFile({ channelId, file })
  } catch (error) {
    console.error(`${context} cover upload failed:`, error)
    return null
  }
}

async function markWebtoonChannelAsPublishing({
  channelId,
  supabase,
  userId,
}: {
  channelId: string
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
}) {
  const { error } = await supabase
    .from('channels')
    .update({ status: 'publishing' })
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', 'webtoon')
    .eq('status', 'draft')

  if (error) {
    throw new Error(error.message)
  }
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
  const pendingPanelFiles = readImageFiles(formData, 'pendingSparkPanelFiles')

  if (!title || !description || !caption || !topic || !punchline) {
    throw new Error('필수 항목이 비어 있습니다.')
  }

  if (!isSparkFormat(formatValue)) {
    throw new Error('유효하지 않은 스파크 포맷입니다.')
  }

  if (!isSparkStatus(statusValue)) {
    throw new Error('유효하지 않은 공개 상태입니다.')
  }

  const panels = parsePanels(panelsJson, formatValue, statusValue, pendingPanelFiles.length)
  const contentRating = parseChannelContentRating(formData)

  return {
    title,
    description,
    coverImageUrl: readOptionalAssetUrl(formData, 'coverImageUrl'),
    ageRating: contentRating.ageRating,
    ratingChecklist: contentRating.ratingChecklist,
    isAdultOnly: contentRating.isAdultOnly,
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

function buildSparkChannelPayload(
  input: SparkDraftInput,
  creatorId: string,
  creatorChannelId: string
) {
  return {
    creator_id: creatorId,
    creator_channel_id: creatorChannelId,
    title: input.title,
    description: input.description,
    cover_image_url: input.coverImageUrl,
    age_rating: input.ageRating,
    rating_checklist: buildRatingChecklistJson(input.ratingChecklist),
    is_adult_only: input.isAdultOnly,
    status: input.status,
    work_type: 'spark' as const,
    spark_format: input.format,
    spark_panel_count: getSparkPanelCount(input.format),
    spark_caption: input.caption,
    spark_meta: buildSparkMeta(input),
    serialization_days: [],
  }
}

function parseWebtoonDraft(formData: FormData): WebtoonDraftInput {
  const title = readText(formData, 'title')
  const description = readText(formData, 'description')
  const category = readText(formData, 'category')
  const statusValue = readText(formData, 'status')
  const workScaleValue = readText(formData, 'workScale') || 'medium'
  const teaserPercentage = readInteger(formData, 'teaserPercentage', 10)

  if (!title || !description || !category) {
    throw new Error('필수 항목이 비어 있습니다.')
  }

  if (!isWebtoonStatus(statusValue)) {
    throw new Error('유효하지 않은 작품 상태입니다.')
  }

  if (!isWorkScale(workScaleValue)) {
    throw new Error('유효하지 않은 작품 규모입니다.')
  }

  if (teaserPercentage < 3 || teaserPercentage > 20) {
    throw new Error('맛보기 비율은 3%에서 20% 사이여야 합니다.')
  }

  const contentRating = parseChannelContentRating(formData)

  return {
    title,
    description,
    coverImageUrl: readOptionalAssetUrl(formData, 'coverImageUrl'),
    ageRating: contentRating.ageRating,
    ratingChecklist: contentRating.ratingChecklist,
    isAdultOnly: contentRating.isAdultOnly,
    isCommentEnabled: readBoolean(formData, 'isCommentEnabled'),
    commentPolicyNote: readOptionalText(formData, 'commentPolicyNote'),
    status: statusValue,
    workScale: workScaleValue,
    teaserPercentage,
    isFreeArchive: readBoolean(formData, 'isFreeArchive'),
    serializationDays: readSerializationDays(formData),
    category,
    tags: sanitizeWebtoonTags(readText(formData, 'tags')),
  }
}

function buildWebtoonChannelPayload(
  input: WebtoonDraftInput,
  creatorId: string,
  creatorChannelId: string
) {
  return {
    creator_id: creatorId,
    creator_channel_id: creatorChannelId,
    title: input.title,
    description: input.description,
    cover_image_url: input.coverImageUrl,
    age_rating: input.ageRating,
    rating_checklist: buildRatingChecklistJson(input.ratingChecklist),
    is_adult_only: input.isAdultOnly,
    is_comment_enabled: input.isCommentEnabled,
    comment_policy_note: input.commentPolicyNote,
    status: input.status,
    work_type: 'webtoon' as const,
    serialization_days: input.serializationDays,
    work_scale: input.workScale,
    teaser_percentage: input.teaserPercentage,
    is_free_archive: input.isFreeArchive,
  }
}

function omitCoverImageUrl<T extends { cover_image_url: string | null }>(payload: T) {
  const nextPayload: Partial<T> = { ...payload }
  delete nextPayload.cover_image_url

  return nextPayload
}

function parseNovelDraft(formData: FormData): NovelDraftInput {
  const title = readText(formData, 'title')
  const description = readText(formData, 'description')
  const category = readText(formData, 'category')
  const statusValue = readText(formData, 'status')
  const workScaleValue = readText(formData, 'workScale') || 'medium'
  const teaserPercentage = readInteger(formData, 'teaserPercentage', 10)

  if (!title || !description || !category) {
    throw new Error('필수 항목이 비어 있습니다.')
  }

  if (!isWebtoonStatus(statusValue)) {
    throw new Error('유효하지 않은 작품 상태입니다.')
  }

  if (!isWorkScale(workScaleValue)) {
    throw new Error('유효하지 않은 작품 규모입니다.')
  }

  if (teaserPercentage < 3 || teaserPercentage > 20) {
    throw new Error('맛보기 비율은 3%에서 20% 사이여야 합니다.')
  }

  const contentRating = parseChannelContentRating(formData)

  return {
    title,
    description,
    coverImageUrl: readOptionalAssetUrl(formData, 'coverImageUrl'),
    ageRating: contentRating.ageRating,
    ratingChecklist: contentRating.ratingChecklist,
    isAdultOnly: contentRating.isAdultOnly,
    isCommentEnabled: readBoolean(formData, 'isCommentEnabled'),
    commentPolicyNote: readOptionalText(formData, 'commentPolicyNote'),
    status: statusValue,
    workScale: workScaleValue,
    teaserPercentage,
    isFreeArchive: readBoolean(formData, 'isFreeArchive'),
    category,
    tags: sanitizeNovelTags(readText(formData, 'tags')),
  }
}

function buildNovelChannelPayload(
  input: NovelDraftInput,
  creatorId: string,
  creatorChannelId: string
) {
  return {
    creator_id: creatorId,
    creator_channel_id: creatorChannelId,
    title: input.title,
    description: input.description,
    cover_image_url: input.coverImageUrl,
    age_rating: input.ageRating,
    rating_checklist: buildRatingChecklistJson(input.ratingChecklist),
    is_adult_only: input.isAdultOnly,
    is_comment_enabled: input.isCommentEnabled,
    comment_policy_note: input.commentPolicyNote,
    status: input.status,
    work_type: 'novel' as const,
    serialization_days: [],
    work_scale: input.workScale,
    teaser_percentage: input.teaserPercentage,
    is_free_archive: input.isFreeArchive,
  }
}

function parseNovelEpisodeDraft(formData: FormData): NovelEpisodeDraftInput {
  const title = readText(formData, 'title')
  const episodeNumber = readInteger(formData, 'episodeNumber')
  const bodyText = readText(formData, 'bodyText')
  const pricingTypeValue = readText(formData, 'pricingType') || 'paid'
  const statusValue = readText(formData, 'status')

  if (!title || episodeNumber <= 0) {
    throw new Error('회차 제목과 번호를 확인해 주세요.')
  }

  if (!isNovelEpisodePricing(pricingTypeValue)) {
    throw new Error('유효하지 않은 가격 정책입니다.')
  }

  if (!isNovelEpisodeStatus(statusValue)) {
    throw new Error('유효하지 않은 회차 상태입니다.')
  }

  if (statusValue === 'published' && bodyText.replace(/\s/g, '').length < 200) {
    throw new Error('공개 소설 회차에는 최소 200자 이상의 본문이 필요합니다.')
  }

  const coinPrice =
    pricingTypeValue === 'free' ? 0 : Math.max(0, readInteger(formData, 'coinPrice', 7))

  return {
    title,
    episodeNumber,
    bodyText,
    pricingType: pricingTypeValue,
    coinPrice,
    isAdultOnly: readBoolean(formData, 'isAdultOnly'),
    status: statusValue,
  }
}

function parseWebtoonEpisodeDraft(formData: FormData): WebtoonEpisodeDraftInput {
  const title = readText(formData, 'title')
  const episodeNumber = readInteger(formData, 'episodeNumber')
  const pricingTypeValue = readText(formData, 'pricingType') || 'paid'
  const statusValue = readText(formData, 'status')
  const imagesJson = readText(formData, 'imagesJson')
  const pendingEpisodeImageFiles = readImageFiles(formData, 'pendingEpisodeImageFiles')

  if (!title || episodeNumber <= 0) {
    throw new Error('회차 제목과 번호를 확인해 주세요.')
  }

  if (!isEpisodePricing(pricingTypeValue)) {
    throw new Error('유효하지 않은 가격 정책입니다.')
  }

  if (!isEpisodeStatus(statusValue)) {
    throw new Error('유효하지 않은 회차 상태입니다.')
  }

  const coinPrice =
    pricingTypeValue === 'free' ? 0 : Math.max(0, readInteger(formData, 'coinPrice', 7))

  return {
    title,
    episodeNumber,
    pricingType: pricingTypeValue,
    coinPrice,
    status: statusValue,
    images: parseEpisodeImages(imagesJson, statusValue, pendingEpisodeImageFiles.length),
  }
}

export async function createSparkChannel(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const creatorChannel = await ensureDefaultCreatorChannel(userId)
  const input = parseSparkDraft(formData)
  const payload = buildSparkChannelPayload(input, userId, creatorChannel.id)
  const pendingCoverImageFile = readOptionalImageFile(formData, 'coverImageFile')
  const pendingPanelFiles = readImageFiles(formData, 'pendingSparkPanelFiles')

  const { data, error } = await supabase
    .from('channels')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(error?.message || '스파크를 만들지 못했습니다.')
  }

  const patch: Database['public']['Tables']['channels']['Update'] = {}

  if (pendingCoverImageFile) {
    patch.cover_image_url = await uploadSparkCoverFile({
      channelId: data.id,
      file: pendingCoverImageFile,
    })
  }

  if (pendingPanelFiles.length > 0) {
    const uploadedPanelUrls = await Promise.all(
      pendingPanelFiles.slice(0, getSparkPanelCount(input.format)).map((file, index) =>
        uploadSparkPanelFile({
          channelId: data.id,
          panelIndex: index,
          file,
        })
      )
    )

    patch.spark_meta = buildSparkMeta({
      ...input,
      coverImageUrl: patch.cover_image_url ?? input.coverImageUrl,
      panels: input.panels.map((panel, index) => ({
        ...panel,
        imageUrl: uploadedPanelUrls[index] ?? panel.imageUrl,
      })),
    })
  }

  if (Object.keys(patch).length > 0) {
    const { error: patchError } = await supabase
      .from('channels')
      .update(patch)
      .eq('id', data.id)
      .eq('creator_id', userId)
      .eq('work_type', 'spark')

    if (patchError) {
      throw new Error(patchError.message)
    }
  }

  revalidatePath('/main/spark')
  revalidatePath('/main/studio/channels')
  revalidatePublicContentCache()
  redirect(`/main/studio/channels/spark/${data.id}/rating`)
}

export async function updateSparkChannel(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const creatorChannel = await ensureDefaultCreatorChannel(userId)
  const channelId = readText(formData, 'channelId')

  if (!channelId) {
    throw new Error('수정 대상 스파크를 찾지 못했습니다.')
  }

  const input = parseSparkDraft(formData)
  const payload = buildSparkChannelPayload(input, userId, creatorChannel.id)

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
  revalidatePublicContentCache()
  redirect(`/main/studio/channels/spark/${channelId}/edit`)
}

async function createWebtoonChannelMutation(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const creatorChannel = await ensureDefaultCreatorChannel(userId)
  const input = parseWebtoonDraft(formData)
  const payload = buildWebtoonChannelPayload(input, userId, creatorChannel.id)
  const pendingCoverImageFile = readOptionalImageFile(formData, 'coverImageFile')

  const { data, error } = await supabase
    .from('channels')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(error?.message || '연재 툰을 만들지 못했습니다.')
  }

  await syncChannelTags(data.id, input.category, input.tags)

  if (pendingCoverImageFile) {
    const uploadedCoverUrl = await uploadOptionalChannelCoverFile({
      channelId: data.id,
      file: pendingCoverImageFile,
      context: 'createWebtoonChannel',
    })

    if (uploadedCoverUrl) {
      const { error: coverError } = await supabase
        .from('channels')
        .update({ cover_image_url: uploadedCoverUrl })
        .eq('id', data.id)
        .eq('creator_id', userId)
        .eq('work_type', 'webtoon')

      if (coverError) {
        throw new Error(coverError.message)
      }
    }
  }

  revalidatePath('/main/explore')
  revalidatePath('/main/studio')
  revalidatePath('/main/studio/channels')
  revalidatePublicContentCache()
  await deleteServerWorkDraft(supabase, userId, formData)

  return appendLocalDraftClearParam(`/main/studio/channels/webtoon/${data.id}/rating`, formData)
}

export async function createWebtoonChannel(formData: FormData) {
  redirect(await createWebtoonChannelMutation(formData))
}

export async function createWebtoonChannelWithState(
  _previousState: WebtoonChannelActionState,
  formData: FormData
): Promise<WebtoonChannelActionState> {
  let nextPath: string

  try {
    nextPath = await createWebtoonChannelMutation(formData)
  } catch (error) {
    console.error('createWebtoonChannel failed:', error)
    return {
      error: getActionErrorMessage(error, '연재 툰을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
    }
  }

  redirect(nextPath)
}

async function updateChannelContentRatingMutation(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const channelId = readText(formData, 'channelId')
  const workType = readText(formData, 'workType')
  const nextPath = readText(formData, 'nextPath')
  const contentRating = parseChannelContentRating(formData)

  if (!channelId) {
    throw new Error('등급을 저장할 작품을 찾지 못했습니다.')
  }

  if (!isWorkType(workType)) {
    throw new Error('유효하지 않은 작품 유형입니다.')
  }

  const { error } = await supabase
    .from('channels')
    .update({
      age_rating: contentRating.ageRating,
      rating_checklist: buildRatingChecklistJson(contentRating.ratingChecklist),
      is_adult_only: contentRating.isAdultOnly,
    })
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', workType)

  if (error) {
    throw new Error(error.message)
  }

  await syncChannelEpisodeAdultVisibility({
    channelId,
    isAdultOnly: contentRating.isAdultOnly,
    supabase,
    workType,
  })

  revalidatePath('/main/explore')
  revalidatePath('/main/spark')
  revalidatePath('/main/studio')
  revalidatePath('/main/studio/channels')
  revalidatePath(`/main/studio/channels/${workType}/${channelId}/edit`)
  revalidatePath(`/main/studio/channels/${workType}/${channelId}/rating`)
  revalidatePublicContentCache()

  if (workType === 'spark') {
    revalidatePath(`/main/spark/${channelId}`)
  } else if (workType === 'webtoon') {
    revalidatePath(`/main/explore/${channelId}`)
  }

  return nextPath || `/main/studio/channels/${workType}/${channelId}/edit`
}

export async function updateChannelContentRating(formData: FormData) {
  redirect(await updateChannelContentRatingMutation(formData))
}

export async function updateChannelContentRatingWithState(
  _previousState: ContentRatingActionState,
  formData: FormData
): Promise<ContentRatingActionState> {
  let nextPath: string

  try {
    nextPath = await updateChannelContentRatingMutation(formData)
  } catch (error) {
    console.error('updateChannelContentRating failed:', error)
    return {
      error: getActionErrorMessage(error, '작품 등급을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
    }
  }

  redirect(nextPath)
}

async function updateWebtoonChannelMutation(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const creatorChannel = await ensureDefaultCreatorChannel(userId)
  const channelId = readText(formData, 'channelId')

  if (!channelId) {
    throw new Error('수정 대상 연재 툰을 찾지 못했습니다.')
  }

  const input = parseWebtoonDraft(formData)
  const payloadWithCover = buildWebtoonChannelPayload(input, userId, creatorChannel.id)
  const coverImageIntent = readCoverImageIntent(formData)
  const pendingCoverImageFile = readOptionalImageFile(formData, 'coverImageFile')
  const payload =
    coverImageIntent !== 'clear' && !input.coverImageUrl
      ? omitCoverImageUrl(payloadWithCover)
      : payloadWithCover

  const { error } = await supabase
    .from('channels')
    .update(payload)
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', 'webtoon')

  if (error) {
    throw new Error(error.message)
  }

  await syncChannelEpisodeAdultVisibility({
    channelId,
    isAdultOnly: input.isAdultOnly,
    supabase,
    workType: 'webtoon',
  })

  await syncChannelTags(channelId, input.category, input.tags)

  if (pendingCoverImageFile) {
    const uploadedCoverUrl = await uploadOptionalChannelCoverFile({
      channelId,
      file: pendingCoverImageFile,
      context: 'updateWebtoonChannel',
    })

    if (uploadedCoverUrl) {
      const { error: coverError } = await supabase
        .from('channels')
        .update({ cover_image_url: uploadedCoverUrl })
        .eq('id', channelId)
        .eq('creator_id', userId)
        .eq('work_type', 'webtoon')

      if (coverError) {
        throw new Error(coverError.message)
      }
    }
  }

  revalidatePath('/main/explore')
  revalidatePath(`/main/explore/${channelId}`)
  revalidatePath('/main/studio/channels')
  revalidatePath(`/main/studio/channels/webtoon/${channelId}/edit`)
  revalidatePublicContentCache()
  await deleteServerWorkDraft(supabase, userId, formData)

  return appendLocalDraftClearParam(`/main/studio/channels/webtoon/${channelId}/edit`, formData)
}

export async function updateWebtoonChannel(formData: FormData) {
  redirect(await updateWebtoonChannelMutation(formData))
}

export async function updateWebtoonChannelWithState(
  _previousState: WebtoonChannelActionState,
  formData: FormData
): Promise<WebtoonChannelActionState> {
  let nextPath: string

  try {
    nextPath = await updateWebtoonChannelMutation(formData)
  } catch (error) {
    console.error('updateWebtoonChannel failed:', error)
    return {
      error: getActionErrorMessage(error, '연재 툰 변경 사항을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
    }
  }

  redirect(nextPath)
}

export async function createNovelChannel(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const creatorChannel = await ensureDefaultCreatorChannel(userId)
  const input = parseNovelDraft(formData)
  const payload = buildNovelChannelPayload(input, userId, creatorChannel.id)
  const pendingCoverImageFile = readOptionalImageFile(formData, 'coverImageFile')

  const { data, error } = await supabase
    .from('channels')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(error?.message || '소설을 만들지 못했습니다.')
  }

  await syncChannelTags(data.id, input.category, input.tags)

  if (pendingCoverImageFile) {
    const uploadedCoverUrl = await uploadChannelCoverFile({
      channelId: data.id,
      file: pendingCoverImageFile,
    })

    const { error: coverError } = await supabase
      .from('channels')
      .update({ cover_image_url: uploadedCoverUrl })
      .eq('id', data.id)
      .eq('creator_id', userId)
      .eq('work_type', 'novel')

    if (coverError) {
      throw new Error(coverError.message)
    }
  }

  revalidatePath('/main/explore')
  revalidatePath('/main/studio')
  revalidatePath('/main/studio/channels')
  revalidatePublicContentCache()
  redirect(`/main/studio/channels/novel/${data.id}/rating`)
}

export async function updateNovelChannel(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const creatorChannel = await ensureDefaultCreatorChannel(userId)
  const channelId = readText(formData, 'channelId')

  if (!channelId) {
    throw new Error('수정 대상 소설을 찾지 못했습니다.')
  }

  const input = parseNovelDraft(formData)
  const payload = buildNovelChannelPayload(input, userId, creatorChannel.id)
  const pendingCoverImageFile = readOptionalImageFile(formData, 'coverImageFile')

  const { error } = await supabase
    .from('channels')
    .update(payload)
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', 'novel')

  if (error) {
    throw new Error(error.message)
  }

  await syncChannelEpisodeAdultVisibility({
    channelId,
    isAdultOnly: input.isAdultOnly,
    supabase,
    workType: 'novel',
  })

  await syncChannelTags(channelId, input.category, input.tags)

  if (pendingCoverImageFile) {
    const uploadedCoverUrl = await uploadChannelCoverFile({
      channelId,
      file: pendingCoverImageFile,
    })

    const { error: coverError } = await supabase
      .from('channels')
      .update({ cover_image_url: uploadedCoverUrl })
      .eq('id', channelId)
      .eq('creator_id', userId)
      .eq('work_type', 'novel')

    if (coverError) {
      throw new Error(coverError.message)
    }
  }

  revalidatePath('/main/explore')
  revalidatePath(`/main/explore/${channelId}`)
  revalidatePath('/main/studio/channels')
  revalidatePublicContentCache()
  redirect(`/main/studio/channels/novel/${channelId}/edit`)
}

export async function createNovelEpisode(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const channelId = readText(formData, 'channelId')

  if (!channelId) {
    throw new Error('회차를 추가할 소설을 찾지 못했습니다.')
  }

  const input = parseNovelEpisodeDraft(formData)

  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('id')
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', 'novel')
    .single()

  if (channelError || !channel) {
    throw new Error('내 소설에서만 회차를 만들 수 있습니다.')
  }

  const publishedAt = input.status === 'published' ? new Date().toISOString() : null

  const { data: episode, error: episodeError } = await supabase
    .from('episodes')
    .insert({
      channel_id: channelId,
      episode_number: input.episodeNumber,
      title: input.title,
      body_text: input.bodyText,
      pricing_type: input.pricingType,
      coin_price: input.coinPrice,
      is_adult_only: input.isAdultOnly,
      status: input.status,
      published_at: publishedAt,
    })
    .select('id')
    .single()

  if (episodeError || !episode) {
    throw new Error(episodeError?.message || '소설 회차를 만들지 못했습니다.')
  }

  revalidatePath('/main/explore')
  revalidatePath(`/main/explore/${channelId}`)
  revalidatePath(`/main/studio/channels/novel/${channelId}/edit`)
  revalidatePublicContentCache()
  redirect(`/main/studio/channels/novel/${channelId}/episodes/${episode.id}/edit`)
}

export async function updateNovelEpisode(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const channelId = readText(formData, 'channelId')
  const episodeId = readText(formData, 'episodeId')

  if (!channelId || !episodeId) {
    throw new Error('수정 대상 소설 회차를 찾지 못했습니다.')
  }

  const input = parseNovelEpisodeDraft(formData)

  const { data: ownedChannel, error: channelError } = await supabase
    .from('channels')
    .select('id')
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', 'novel')
    .single()

  if (channelError || !ownedChannel) {
    throw new Error('내 소설에서만 회차를 수정할 수 있습니다.')
  }

  const { data: existingEpisode, error: existingError } = await supabase
    .from('episodes')
    .select('id, published_at, status')
    .eq('id', episodeId)
    .eq('channel_id', channelId)
    .single()

  if (existingError || !existingEpisode) {
    throw new Error('수정할 소설 회차를 찾지 못했습니다.')
  }

  const publishedAt =
    input.status === 'published'
      ? existingEpisode.published_at ?? new Date().toISOString()
      : null

  const { error } = await supabase
    .from('episodes')
    .update({
      episode_number: input.episodeNumber,
      title: input.title,
      body_text: input.bodyText,
      pricing_type: input.pricingType,
      coin_price: input.coinPrice,
      is_adult_only: input.isAdultOnly,
      status: input.status,
      published_at: publishedAt,
    })
    .eq('id', episodeId)
    .eq('channel_id', channelId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/main/explore')
  revalidatePath(`/main/explore/${channelId}`)
  revalidatePath(`/main/explore/${channelId}/episodes/${episodeId}`)
  revalidatePath(`/main/studio/channels/novel/${channelId}/edit`)
  revalidatePublicContentCache()
  redirect(`/main/studio/channels/novel/${channelId}/episodes/${episodeId}/edit`)
}

export async function createWebtoonEpisode(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const channelId = readText(formData, 'channelId')
  const pendingEpisodeImageFiles = readImageFiles(formData, 'pendingEpisodeImageFiles')

  if (!channelId) {
    throw new Error('회차를 추가할 채널을 찾지 못했습니다.')
  }

  const input = parseWebtoonEpisodeDraft(formData)

  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('id, is_adult_only')
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', 'webtoon')
    .single()

  if (channelError || !channel) {
    throw new Error('내 연재 툰에서만 회차를 만들 수 있습니다.')
  }

  const publishedAt = input.status === 'published' ? new Date().toISOString() : null

  const { data: episode, error: episodeError } = await supabase
    .from('episodes')
    .insert({
      channel_id: channelId,
      episode_number: input.episodeNumber,
      title: input.title,
      pricing_type: input.pricingType,
      coin_price: input.coinPrice,
      is_adult_only: channel.is_adult_only,
      status: input.status,
      published_at: publishedAt,
    })
    .select('id')
    .single()

  if (episodeError || !episode) {
    throw new Error(episodeError?.message || '회차를 만들지 못했습니다.')
  }

  if (input.images.length > 0) {
    const { error: imagesError } = await supabase.from('episode_images').insert(
      input.images.map((image) => ({
        episode_id: episode.id,
        image_url: image.imageUrl,
        original_image_url: image.originalImageUrl,
        optimized_image_url: image.optimizedImageUrl,
        thumbnail_image_url: image.thumbnailImageUrl,
        sort_order: image.sortOrder,
        width: image.width,
        height: image.height,
        file_size_bytes: image.fileSizeBytes,
        content_type: image.contentType,
        derivatives: image.derivatives as Json,
        is_verified: image.isVerified,
        processing_status: image.processingStatus ?? 'ready',
        processing_error: image.processingError,
        cleanup_status: image.cleanupStatus ?? 'active',
        original_file_path: image.originalFilePath,
        optimized_file_path: image.optimizedFilePath,
        thumbnail_file_path: image.thumbnailFilePath,
      }))
    )

    if (imagesError) {
      throw new Error(imagesError.message)
    }
  }

  if (pendingEpisodeImageFiles.length > 0) {
    const uploadedImages = await mapWithConcurrency(
      pendingEpisodeImageFiles,
      WEBTOON_EPISODE_CREATE_UPLOAD_CONCURRENCY,
      (file, index) =>
        uploadEpisodeImageFile({
          channelId,
          episodeId: episode.id,
          sortOrder: index,
          file,
        }).then((image) => ({
          episode_id: episode.id,
          image_url: image.imageUrl,
          original_image_url: image.originalImageUrl,
          optimized_image_url: image.optimizedImageUrl,
          thumbnail_image_url: image.thumbnailImageUrl,
          sort_order: input.images.length + index,
          width: image.width,
          height: image.height,
          file_size_bytes: image.fileSizeBytes,
          content_type: image.contentType,
          derivatives: image.derivatives as Json,
          is_verified: true,
          processing_status: image.processingStatus,
          processing_error: image.processingError,
          cleanup_status: image.cleanupStatus,
          original_file_path: image.originalFilePath,
          optimized_file_path: image.optimizedFilePath,
          thumbnail_file_path: image.thumbnailFilePath,
        }))
    )

    const { error: uploadedImagesError } = await supabase
      .from('episode_images')
      .insert(uploadedImages)

    if (uploadedImagesError) {
      throw new Error(uploadedImagesError.message)
    }
  }

  if (input.status === 'published') {
    await markWebtoonChannelAsPublishing({ channelId, supabase, userId })
  }

  revalidatePath('/main/explore')
  revalidatePath(`/main/explore/${channelId}`)
  revalidatePath(`/main/studio/channels/webtoon/${channelId}/edit`)
  revalidatePublicContentCache()
  await deleteServerWorkDraft(supabase, userId, formData)
  redirect(`/main/studio/channels/webtoon/${channelId}/episodes/${episode.id}/edit?saved=1`)
}

export async function updateWebtoonEpisode(formData: FormData) {
  const { supabase, userId } = await requireCreatorAccess()
  const channelId = readText(formData, 'channelId')
  const episodeId = readText(formData, 'episodeId')

  if (!channelId || !episodeId) {
    throw new Error('수정 대상 회차를 찾지 못했습니다.')
  }

  const input = parseWebtoonEpisodeDraft(formData)

  const { data: ownedChannel, error: channelError } = await supabase
    .from('channels')
    .select('id, is_adult_only')
    .eq('id', channelId)
    .eq('creator_id', userId)
    .eq('work_type', 'webtoon')
    .single()

  if (channelError || !ownedChannel) {
    throw new Error('내 연재 툰에서만 회차를 수정할 수 있습니다.')
  }

  const { data: existingEpisode, error: existingError } = await supabase
    .from('episodes')
    .select('id, published_at, status')
    .eq('id', episodeId)
    .eq('channel_id', channelId)
    .single()

  if (existingError || !existingEpisode) {
    throw new Error('수정할 회차를 찾지 못했습니다.')
  }

  const publishedAt =
    input.status === 'published'
      ? existingEpisode.published_at ?? new Date().toISOString()
      : null

  const { error: updateEpisodeError } = await supabase.rpc(
    'update_webtoon_episode_with_images',
    {
      p_user_id: userId,
      p_channel_id: channelId,
      p_episode_id: episodeId,
      p_episode_number: input.episodeNumber,
      p_title: input.title,
      p_pricing_type: input.pricingType,
      p_coin_price: input.coinPrice,
      p_is_adult_only: ownedChannel.is_adult_only,
      p_status: input.status,
      p_published_at: publishedAt,
      p_images: input.images.map((image) => ({
        image_url: image.imageUrl,
        original_image_url: image.originalImageUrl,
        optimized_image_url: image.optimizedImageUrl,
        thumbnail_image_url: image.thumbnailImageUrl,
        sort_order: image.sortOrder,
        width: image.width,
        height: image.height,
        file_size_bytes: image.fileSizeBytes,
        content_type: image.contentType,
        derivatives: image.derivatives as Json,
        is_verified: image.isVerified,
        processing_status: image.processingStatus ?? 'ready',
        processing_error: image.processingError,
        cleanup_status: image.cleanupStatus ?? 'active',
        original_file_path: image.originalFilePath,
        optimized_file_path: image.optimizedFilePath,
        thumbnail_file_path: image.thumbnailFilePath,
      })),
    }
  )

  if (updateEpisodeError) {
    throw new Error(updateEpisodeError.message)
  }

  if (input.status === 'published') {
    await markWebtoonChannelAsPublishing({ channelId, supabase, userId })
  }

  revalidatePath('/main/explore')
  revalidatePath(`/main/explore/${channelId}`)
  revalidatePath(`/main/explore/${channelId}/episodes/${episodeId}`)
  revalidatePath(`/main/studio/channels/webtoon/${channelId}/edit`)
  revalidatePublicContentCache()
  await deleteServerWorkDraft(supabase, userId, formData)
  redirect(`/main/studio/channels/webtoon/${channelId}/episodes/${episodeId}/edit?saved=1`)
}
