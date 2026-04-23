import { NextRequest, NextResponse } from 'next/server'
import { generateSignedUrl, AllowedContentType } from '@/lib/gcs/upload'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId, episodeId, sortOrder, contentType } = await req.json()

    // channelId가 현재 유저 소유 채널인지 검증 (보안)
    const { data: ownedChannel, error: channelError } = await supabase
      .from('channels')
      .select('id')
      .eq('id', channelId)
      .eq('creator_id', user.id)
      .single()

    if (channelError || !ownedChannel) {
      return NextResponse.json({ error: 'Forbidden: not your channel' }, { status: 403 })
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const { url, filePath } = await generateSignedUrl({
      channelId,
      episodeId,
      sortOrder,
      contentType: contentType as AllowedContentType,
    })

    return NextResponse.json({ url, filePath }, { status: 200 })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
