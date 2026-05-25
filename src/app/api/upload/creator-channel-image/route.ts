import { NextRequest, NextResponse } from 'next/server'
import {
  generateCreatorChannelImageSignedUrl,
  type AllowedContentType,
} from '@/lib/storage/upload'
import { createClient } from '@/lib/supabase/server'

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'] as const

export const runtime = 'nodejs'

function isImageRole(value: unknown): value is 'avatar' | 'cover' {
  return value === 'avatar' || value === 'cover'
}

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

    const { creatorChannelId, imageRole, contentType } = await req.json()

    if (typeof creatorChannelId !== 'string' || creatorChannelId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid creator channel id' }, { status: 400 })
    }

    if (!isImageRole(imageRole)) {
      return NextResponse.json({ error: 'Invalid image role' }, { status: 400 })
    }

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const { data: ownedChannel, error: channelError } = await supabase
      .from('creator_channels')
      .select('id, owner_id')
      .eq('id', creatorChannelId)
      .eq('owner_id', user.id)
      .single()

    if (channelError || !ownedChannel) {
      return NextResponse.json({ error: 'Forbidden: not your creator channel' }, { status: 403 })
    }

    const signedUpload = await generateCreatorChannelImageSignedUrl({
      creatorChannelId,
      imageRole,
      contentType: contentType as AllowedContentType,
    })

    return NextResponse.json(signedUpload, { status: 200 })
  } catch (error) {
    console.error('Error generating creator channel image signed URL:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
