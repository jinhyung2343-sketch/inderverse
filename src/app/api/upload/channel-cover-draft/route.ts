import { NextRequest, NextResponse } from 'next/server'
import { generateDraftChannelCoverSignedUrl, type AllowedContentType } from '@/lib/storage/upload'
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

    const { contentType } = await req.json()

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const signedUpload = await generateDraftChannelCoverSignedUrl({
      userId: user.id,
      contentType: contentType as AllowedContentType,
    })

    return NextResponse.json(signedUpload, { status: 200 })
  } catch (error) {
    console.error('Error generating draft channel cover signed URL:', error)
    return NextResponse.json(
      {
        error: '커버 업로드 주소를 만들지 못했습니다. Supabase Storage 버킷 설정을 확인해 주세요.',
      },
      { status: 500 }
    )
  }
}
