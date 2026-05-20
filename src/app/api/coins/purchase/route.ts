import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { resolveEpisodeReference } from '@/lib/server/episode-reference'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const { episodeId, channelId, episodeNumber } = body as {
      episodeId?: unknown
      channelId?: unknown
      episodeNumber?: unknown
    }
    const normalizedEpisodeId =
      typeof episodeId === 'string' && episodeId.trim().length > 0 ? episodeId : undefined
    const normalizedChannelId =
      typeof channelId === 'string' && channelId.trim().length > 0 ? channelId : undefined
    const normalizedEpisodeNumber =
      typeof episodeNumber === 'number' && Number.isInteger(episodeNumber) && episodeNumber > 0
        ? episodeNumber
        : undefined
    const hasEpisodeId = Boolean(normalizedEpisodeId)
    const hasChannelReference =
      normalizedChannelId !== undefined && normalizedEpisodeNumber !== undefined

    if (!hasEpisodeId && !hasChannelReference) {
      return NextResponse.json({ error: 'Invalid episode reference' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const episode = await resolveEpisodeReference(adminClient, {
      episodeId: normalizedEpisodeId,
      channelId: normalizedChannelId,
      episodeNumber: normalizedEpisodeNumber,
    })

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }

    const { data, error } = await adminClient.rpc('purchase_episode', {
      p_user_id: user.id,
      p_episode_id: episode.id,
    })

    if (error) {
      const message = error.message || 'Purchase failed'

      if (message.includes('Insufficient balance')) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 402 })
      }

      if (message.includes('Episode is free')) {
        return NextResponse.json({ error: 'Free episode' }, { status: 400 })
      }

      if (message.includes('Episode not available')) {
        return NextResponse.json({ error: 'Episode not available' }, { status: 403 })
      }

      if (message.includes('Wallet not found')) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
      }

      throw error
    }

    if (data && typeof data === 'object' && 'status' in data && data.status === 'already_purchased') {
      return NextResponse.json({ message: 'Already purchased' }, { status: 200 })
    }

    return NextResponse.json({ success: true, result: data }, { status: 200 })
  } catch (error) {
    console.error('Error purchasing episode:', error)
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 })
  }
}
