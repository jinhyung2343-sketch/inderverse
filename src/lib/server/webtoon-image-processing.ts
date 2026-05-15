import 'server-only'

import { regenerateWebtoonEpisodeDerivatives } from '@/lib/gcs/upload'
import { mapWithConcurrency } from '@/lib/server/concurrency'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/lib/supabase/types'

type WebtoonImageProcessingJob = Database['public']['Tables']['episode_images']['Row']

const WEBTOON_IMAGE_PROCESSING_CONCURRENCY = 2

export interface WebtoonImageProcessingRunResult {
  claimed: number
  completed: number
  retryNeeded: number
  failed: number
  items: Array<{
    id: string
    episodeId: string
    status: 'ready' | 'retry_needed' | 'failed'
    message: string | null
  }>
}

export function getWebtoonImageProcessingSecret() {
  return (
    process.env.WEBTOON_IMAGE_PROCESSING_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.INTERNAL_JOB_SECRET?.trim() ||
    null
  )
}

export function isAuthorizedWebtoonImageProcessingRequest({
  authorization,
  internalSecret,
}: {
  authorization: string | null
  internalSecret: string | null
}) {
  const expectedSecret = getWebtoonImageProcessingSecret()

  if (!expectedSecret) {
    return false
  }

  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null

  return bearerToken === expectedSecret || internalSecret === expectedSecret
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function getChannelIdFromOriginalPath(filePath: string) {
  const [folder, channelId] = filePath.split('/')

  if (folder !== 'originals' || !channelId) {
    throw new Error('원본 이미지 경로에서 채널 정보를 찾지 못했습니다.')
  }

  return channelId
}

async function completeProcessingJob({
  imageId,
  status,
  error,
  result,
}: {
  imageId: string
  status: 'ready' | 'retry_needed' | 'failed'
  error: string | null
  result?: Awaited<ReturnType<typeof regenerateWebtoonEpisodeDerivatives>>
}) {
  const admin = createAdminClient()
  const { error: updateError } = await admin.rpc('complete_webtoon_image_processing_job', {
    p_image_id: imageId,
    p_status: status,
    p_error: error,
    p_image_url: result?.imageUrl ?? null,
    p_optimized_image_url: result?.optimizedImageUrl ?? null,
    p_thumbnail_image_url: result?.thumbnailImageUrl ?? null,
    p_width: result?.width ?? null,
    p_height: result?.height ?? null,
    p_file_size_bytes: result?.fileSizeBytes ?? null,
    p_content_type: result?.contentType ?? null,
    p_derivatives: (result?.derivatives ?? null) as Json | null,
    p_optimized_file_path: result?.optimizedFilePath ?? null,
    p_thumbnail_file_path: result?.thumbnailFilePath ?? null,
  })

  if (updateError) {
    throw new Error(updateError.message)
  }
}

async function processImageJob(
  job: WebtoonImageProcessingJob
): Promise<WebtoonImageProcessingRunResult['items'][number]> {
  try {
    if (!job.original_file_path) {
      const message = '원본 파일 경로가 없어 재처리할 수 없습니다.'
      await completeProcessingJob({
        imageId: job.id,
        status: 'failed',
        error: message,
      })
      return {
        id: job.id,
        episodeId: job.episode_id,
        status: 'failed',
        message,
      }
    }

    const channelId = getChannelIdFromOriginalPath(job.original_file_path)
    const result = await regenerateWebtoonEpisodeDerivatives({
      channelId,
      episodeId: job.episode_id,
      sortOrder: job.sort_order,
      originalFilePath: job.original_file_path,
      originalImageUrl: job.original_image_url,
      contentType: job.content_type,
    })

    await completeProcessingJob({
      imageId: job.id,
      status: 'ready',
      error: null,
      result,
    })

    return {
      id: job.id,
      episodeId: job.episode_id,
      status: 'ready',
      message: null,
    }
  } catch (error) {
    const message = getErrorMessage(error).slice(0, 500)
    const status = job.processing_attempt_count + 1 >= 5 ? 'failed' : 'retry_needed'

    await completeProcessingJob({
      imageId: job.id,
      status,
      error: message,
    })

    return {
      id: job.id,
      episodeId: job.episode_id,
      status,
      message,
    }
  }
}

export async function runWebtoonImageProcessingJobs(
  limit = 10
): Promise<WebtoonImageProcessingRunResult> {
  const boundedLimit = Math.min(Math.max(Math.trunc(limit) || 10, 1), 50)
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('claim_webtoon_image_processing_jobs', {
    p_limit: boundedLimit,
  })

  if (error) {
    throw new Error(error.message)
  }

  const jobs = (data ?? []) as WebtoonImageProcessingJob[]
  const items = await mapWithConcurrency(
    jobs,
    WEBTOON_IMAGE_PROCESSING_CONCURRENCY,
    (job) => processImageJob(job)
  )

  return {
    claimed: jobs.length,
    completed: items.filter((item) => item.status === 'ready').length,
    retryNeeded: items.filter((item) => item.status === 'retry_needed').length,
    failed: items.filter((item) => item.status === 'failed').length,
    items,
  }
}
