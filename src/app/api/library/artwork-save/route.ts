import { NextRequest, NextResponse } from 'next/server'
import { getPublicArtworkById } from '@/lib/server/explore'
import { getSavedArtworkIds } from '@/lib/server/library'
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
      return NextResponse.json({ error: 'Login required to save artworks' }, { status: 401 })
    }

    const { artworkId } = await req.json()

    if (typeof artworkId !== 'string' || artworkId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid artwork id' }, { status: 400 })
    }

    const artwork = await getPublicArtworkById(artworkId)

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
    }

    const storedArtworkId = artwork.backendChannelId ?? artwork.id
    const lookupArtworkIds = Array.from(new Set([artworkId, artwork.id, storedArtworkId]))

    const { data: existingSave } = await supabase
      .from('artwork_saves')
      .select('id')
      .eq('user_id', user.id)
      .in('artwork_id', lookupArtworkIds)
      .limit(1)
      .maybeSingle()

    if (existingSave) {
      const { error } = await supabase
        .from('artwork_saves')
        .delete()
        .eq('user_id', user.id)
        .in('artwork_id', lookupArtworkIds)

      if (error) {
        throw error
      }
    } else {
      const { error } = await supabase
        .from('artwork_saves')
        .insert({
          user_id: user.id,
          artwork_id: storedArtworkId,
        })

      if (error) {
        throw error
      }
    }

    const savedArtworkIds = await getSavedArtworkIds()

    return NextResponse.json(
      {
        success: true,
        saved: savedArtworkIds.includes(storedArtworkId),
        savedArtworkIds,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error toggling artwork save:', message)
    return NextResponse.json({ error: 'Artwork save toggle failed' }, { status: 500 })
  }
}
