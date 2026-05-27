import { NextRequest, NextResponse } from 'next/server'
import { uploadEpisodeImageFile } from '@/lib/storage/upload'
import { createClient } from '@/lib/supabase/server'
import {
  buildTrafficCostHeaders,
  getUploadBudgetDecision,
} from '@/lib/traffic-cost-control'
import type { Json } from '@/lib/supabase/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number.parseInt(req.headers.get('content-length') ?? '', 10)
    const budgetDecision = getUploadBudgetDecision(Number.isFinite(contentLength) ? contentLength : null)

    if (budgetDecision.type === 'block') {
      return NextResponse.json(
        { error: '업로드 요청 용량이 너무 큽니다.' },
        {
          status: budgetDecision.status,
          headers: buildTrafficCostHeaders('creatorUpload', { includeCacheControl: true }),
        }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const channelId = formData.get('channelId')
    const episodeId = formData.get('episodeId')
    const sortOrderValue = formData.get('sortOrder')
    const shouldPersistImage = formData.get('persistImage') === 'on'
    const file = formData.get('file')

    if (typeof channelId !== 'string' || channelId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid channel id' }, { status: 400 })
    }

    if (typeof episodeId !== 'string' || episodeId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid episode id' }, { status: 400 })
    }

    const sortOrder =
      typeof sortOrderValue === 'string' ? Number.parseInt(sortOrderValue, 10) : Number.NaN

    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
      return NextResponse.json({ error: 'Invalid sort order' }, { status: 400 })
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 })
    }

    const { data: ownedChannel, error: channelError } = await supabase
      .from('channels')
      .select('id')
      .eq('id', channelId)
      .eq('creator_id', user.id)
      .eq('work_type', 'webtoon')
      .single()

    if (channelError || !ownedChannel) {
      return NextResponse.json({ error: 'Forbidden: not your webtoon channel' }, { status: 403 })
    }

    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('id')
      .eq('id', episodeId)
      .eq('channel_id', ownedChannel.id)
      .single()

    if (episodeError || !episode) {
      return NextResponse.json({ error: 'Episode does not belong to your channel' }, { status: 403 })
    }

    const image = await uploadEpisodeImageFile({
      channelId,
      episodeId,
      sortOrder,
      file,
    })

    if (shouldPersistImage) {
      await supabase
        .from('episode_images')
        .delete()
        .eq('episode_id', episodeId)
        .eq('sort_order', sortOrder)

      const { error: imageInsertError } = await supabase.from('episode_images').insert({
        episode_id: episodeId,
        image_url: image.imageUrl,
        original_image_url: image.originalImageUrl,
        optimized_image_url: image.optimizedImageUrl,
        thumbnail_image_url: image.thumbnailImageUrl,
        sort_order: sortOrder,
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
      })

      if (imageInsertError) {
        throw new Error(imageInsertError.message)
      }
    }

    return NextResponse.json(image, {
      status: 200,
      headers: buildTrafficCostHeaders('creatorUpload', { includeCacheControl: true }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Webtoon episode image upload error:', message)
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: buildTrafficCostHeaders('creatorUpload', { includeCacheControl: true }),
      }
    )
  }
}
