import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { WorkRecord, WorkType } from '@/lib/work'

type WorkRow = {
  id: string
  creator_id: string
  creator_channel_id: string | null
  work_type: WorkType
  title: string
  description: string | null
  cover_image_url: string | null
  status: WorkRecord['status']
  is_adult_only: boolean
  updated_at: string
}

function mapWorkRow(row: WorkRow): WorkRecord {
  return {
    id: row.id,
    creatorId: row.creator_id,
    creatorChannelId: row.creator_channel_id,
    workType: row.work_type,
    title: row.title,
    description: row.description?.trim() || '',
    coverImageUrl: row.cover_image_url,
    status: row.status,
    isAdultOnly: row.is_adult_only,
    updatedAt: row.updated_at,
  }
}

export async function getCreatorWorkList(options?: { workTypes?: WorkType[] }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('channels')
    .select(
      'id, creator_id, creator_channel_id, work_type, title, description, cover_image_url, status, is_adult_only, updated_at'
    )
    .eq('creator_id', user.id)
    .order('updated_at', { ascending: false })

  if (options?.workTypes?.length) {
    query = query.in('work_type', options.workTypes)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to load creator works: ${error.message}`)
  }

  return ((data ?? []) as WorkRow[]).map(mapWorkRow)
}

export async function getCreatorWorkById(id: string) {
  const works = await getCreatorWorkList()
  return works.find((work) => work.id === id) ?? null
}
