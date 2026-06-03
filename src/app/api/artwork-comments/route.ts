import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import {
  ARTWORK_COMMENT_MAX_LENGTH,
  createArtworkComment,
  isValidArtworkCommentBody,
  normalizeArtworkCommentBody,
} from '@/lib/server/artwork-comments'
import { getPublicArtworkById } from '@/lib/server/explore'
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
      return NextResponse.json({ error: 'Login required to comment' }, { status: 401 })
    }

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { artworkId, comment } = body as { artworkId?: unknown; comment?: unknown }
    const artworkIdValue = typeof artworkId === 'string' ? artworkId.trim() : ''
    const commentBody = normalizeArtworkCommentBody(comment)

    if (!artworkIdValue) {
      return NextResponse.json({ error: 'Invalid artwork id' }, { status: 400 })
    }

    if (!isValidArtworkCommentBody(commentBody)) {
      return NextResponse.json(
        { error: `댓글은 1자 이상 ${ARTWORK_COMMENT_MAX_LENGTH}자 이하로 작성해 주세요.` },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_adult_verified')
      .eq('id', user.id)
      .maybeSingle()

    const artwork = await getPublicArtworkById(artworkIdValue, {
      includeAdultContent: profile?.is_adult_verified ?? false,
      viewerId: user.id,
    })

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
    }

    if (!artwork.backendChannelId) {
      return NextResponse.json({ error: 'Comments are not available for this artwork yet' }, { status: 400 })
    }

    if (!artwork.isCommentEnabled) {
      return NextResponse.json({ error: 'Comments are closed for this artwork' }, { status: 403 })
    }

    await createArtworkComment({
      channelId: artwork.backendChannelId,
      userId: user.id,
      body: commentBody,
    })

    revalidatePath(`/main/explore/${artwork.id}`)
    revalidatePath(`/main/explore/${artwork.backendChannelId}`)

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating artwork comment:', message)
    return NextResponse.json({ error: message || 'Artwork comment failed' }, { status: 500 })
  }
}
