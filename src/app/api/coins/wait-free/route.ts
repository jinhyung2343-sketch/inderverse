import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { episodeId, channelId } = await req.json()

    if (typeof episodeId !== 'string' || episodeId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid episode id' }, { status: 400 })
    }

    if (channelId !== undefined && (typeof channelId !== 'string' || channelId.trim().length === 0)) {
      return NextResponse.json({ error: 'Invalid channel id' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: episode } = await adminClient
      .from('episodes')
      .select('pricing_type, channel_id')
      .eq('id', episodeId)
      .single()

    if (!episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    if (episode.pricing_type !== 'wait_free') {
      return NextResponse.json({ error: 'This episode is not eligible for wait-free' }, { status: 400 })
    }

    if (channelId && channelId !== episode.channel_id) {
      return NextResponse.json({ error: 'Episode does not belong to the provided channel' }, { status: 400 })
    }

    const { data: channel } = await adminClient
      .from('channels')
      .select('wait_free_hours')
      .eq('id', episode.channel_id)
      .single()

    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

    const { data: lastUnlock } = await adminClient
      .from('wait_free_unlocks')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel_id', episode.channel_id)
      .order('unlocked_at', { ascending: false })
      .limit(1)
      .single()

    const now = new Date()

    if (lastUnlock) {
      const nextAvailable = new Date(lastUnlock.next_unlock_available_at)
      if (now < nextAvailable) {
        return NextResponse.json({ 
          error: 'Not yet available',
          available_at: nextAvailable
        }, { status: 403 })
      }
    }

    // 기다무 사용 기록 생성 및 에피소드 열람 허용
    const nextUnlockAvailableAt = new Date(now.getTime() + channel.wait_free_hours * 60 * 60 * 1000)

    await adminClient
      .from('wait_free_unlocks')
      .insert({
        user_id: user.id,
        channel_id: episode.channel_id,
        episode_id: episodeId,
        next_unlock_available_at: nextUnlockAvailableAt.toISOString()
      })

    return NextResponse.json({ success: true, next_unlock_available_at: nextUnlockAvailableAt }, { status: 200 })
  } catch (error) {
    console.error('Wait free error:', error)
    return NextResponse.json({ error: 'Failed to unlock wait free' }, { status: 500 })
  }
}
