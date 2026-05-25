import 'server-only'

import { mapWithConcurrency } from '@/lib/server/concurrency'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUPABASE_ASSET_BUCKET } from '@/lib/storage/upload'
import type { Database } from '@/lib/supabase/types'

type StorageCleanupJob = Database['public']['Tables']['storage_cleanup_jobs']['Row']

const STORAGE_CLEANUP_CONCURRENCY = 5

export interface StorageCleanupRunResult {
  claimed: number
  completed: number
  ignored: number
  failed: number
  items: Array<{
    id: string
    filePath: string
    status: 'completed' | 'ignored' | 'failed'
    message: string | null
  }>
}

export function getStorageCleanupSecret() {
  return (
    process.env.STORAGE_CLEANUP_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.INTERNAL_JOB_SECRET?.trim() ||
    null
  )
}

export function isAuthorizedStorageCleanupRequest({
  authorization,
  internalSecret,
}: {
  authorization: string | null
  internalSecret: string | null
}) {
  const expectedSecret = getStorageCleanupSecret()

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

async function completeJob(
  jobId: string,
  status: 'completed' | 'ignored' | 'failed',
  error: string | null
) {
  const admin = createAdminClient()
  const { error: updateError } = await admin.rpc('complete_storage_cleanup_job', {
    p_job_id: jobId,
    p_status: status,
    p_error: error,
  })

  if (updateError) {
    throw new Error(updateError.message)
  }
}

async function isFileStillReferenced(filePath: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('is_storage_file_referenced', {
    p_file_path: filePath,
  })

  if (error) {
    throw new Error(error.message)
  }

  return Boolean(data)
}

async function deleteStorageFile(filePath: string) {
  const admin = createAdminClient()
  const { error } = await admin.storage.from(SUPABASE_ASSET_BUCKET).remove([filePath])

  if (error && !error.message.toLowerCase().includes('not found')) {
    throw new Error(error.message)
  }

  return 'deleted'
}

async function processCleanupJob(job: StorageCleanupJob): Promise<StorageCleanupRunResult['items'][number]> {
  try {
    const stillReferenced = await isFileStillReferenced(job.file_path)

    if (stillReferenced) {
      const message = '파일이 아직 작품 이미지에서 참조되고 있어 삭제하지 않았습니다.'
      await completeJob(job.id, 'ignored', message)
      return {
        id: job.id,
        filePath: job.file_path,
        status: 'ignored',
        message,
      }
    }

    const deleteResult = await deleteStorageFile(job.file_path)
    const message = deleteResult === 'already_missing' ? '이미 삭제된 파일입니다.' : null
    await completeJob(job.id, 'completed', message)

    return {
      id: job.id,
      filePath: job.file_path,
      status: 'completed',
      message,
    }
  } catch (error) {
    const message = getErrorMessage(error).slice(0, 500)
    await completeJob(job.id, 'failed', message)

    return {
      id: job.id,
      filePath: job.file_path,
      status: 'failed',
      message,
    }
  }
}

export async function runStorageCleanupJobs(limit = 25): Promise<StorageCleanupRunResult> {
  const boundedLimit = Math.min(Math.max(Math.trunc(limit) || 25, 1), 100)
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('claim_storage_cleanup_jobs', {
    p_limit: boundedLimit,
  })

  if (error) {
    throw new Error(error.message)
  }

  const jobs = (data ?? []) as StorageCleanupJob[]
  const items = await mapWithConcurrency(
    jobs,
    STORAGE_CLEANUP_CONCURRENCY,
    (job) => processCleanupJob(job)
  )

  return {
    claimed: jobs.length,
    completed: items.filter((item) => item.status === 'completed').length,
    ignored: items.filter((item) => item.status === 'ignored').length,
    failed: items.filter((item) => item.status === 'failed').length,
    items,
  }
}
