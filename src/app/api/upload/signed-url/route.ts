import { NextRequest, NextResponse } from 'next/server'
import {
  generateSignedUrl,
  isAllowedContentType,
  MAX_IMAGE_FILE_BYTES,
} from '@/lib/gcs/upload'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId, episodeId, sortOrder, contentType } = await req.json()

    if (typeof channelId !== 'string' || channelId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid channel id' }, { status: 400 })
    }

    if (typeof episodeId !== 'string' || episodeId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid episode id' }, { status: 400 })
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
      return NextResponse.json({ error: 'Invalid sort order' }, { status: 400 })
    }

    // channelId가 현재 유저 소유 채널인지 검증 (보안)
    const { data: ownedChannel, error: channelError } = await supabase
      .from('channels')
      .select('id, creator_id')
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

    if (!isAllowedContentType(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const { url, filePath, publicUrl } = await generateSignedUrl({
      channelId,
      episodeId,
      sortOrder,
      contentType,
    })

    return NextResponse.json({ url, filePath, publicUrl, maxFileBytes: MAX_IMAGE_FILE_BYTES }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error generating signed URL:', message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
