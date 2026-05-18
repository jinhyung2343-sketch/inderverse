import { NextRequest, NextResponse } from 'next/server'
import { generateSparkCoverSignedUrl, type AllowedContentType } from '@/lib/gcs/upload'
import { createClient } from '@/lib/supabase/server'

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'] as const

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

    const { channelId, contentType } = await req.json()

    if (typeof channelId !== 'string' || channelId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid channel id' }, { status: 400 })
    }

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const { data: ownedChannel, error: channelError } = await supabase
      .from('channels')
      .select('id, creator_id, work_type')
      .eq('id', channelId)
      .eq('creator_id', user.id)
      .eq('work_type', 'spark')
      .single()

    if (channelError || !ownedChannel) {
      return NextResponse.json({ error: 'Forbidden: not your spark channel' }, { status: 403 })
    }

    const { url, filePath, publicUrl } = await generateSparkCoverSignedUrl({
      channelId,
      contentType: contentType as AllowedContentType,
    })

    return NextResponse.json({ url, filePath, publicUrl }, { status: 200 })
  } catch (error) {
    console.error('Error generating spark cover signed URL:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
