import { NextRequest, NextResponse } from 'next/server'
import { uploadEpisodeImageFile } from '@/lib/gcs/upload'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json(image, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Webtoon episode image upload error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
