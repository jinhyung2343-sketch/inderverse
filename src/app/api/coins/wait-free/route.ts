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
    const adminClient = createAdminClient()

    // 채널 설정 확인 (wait_free_hours 조회용)
    const { data: channel } = await adminClient
      .from('channels')
      .select('wait_free_hours')
      .eq('id', channelId)
      .single()

    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

    // 에피소드가 기다무(wait_free) 대상인지 유형 검증
    const { data: episode } = await adminClient
      .from('episodes')
      .select('pricing_type')
      .eq('id', episodeId)
      .single()

    if (!episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    if (episode.pricing_type !== 'wait_free') {
      return NextResponse.json({ error: 'This episode is not eligible for wait-free' }, { status: 400 })
    }

    // 유저의 마지막 기다무 해금 기록 확인
    const { data: lastUnlock } = await adminClient
      .from('wait_free_unlocks')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel_id', channelId)
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
        channel_id: channelId,
        episode_id: episodeId,
        next_unlock_available_at: nextUnlockAvailableAt.toISOString()
      })

    return NextResponse.json({ success: true, next_unlock_available_at: nextUnlockAvailableAt }, { status: 200 })
  } catch (error: any) {
    console.error('Wait free error:', error)
    return NextResponse.json({ error: 'Failed to unlock wait free' }, { status: 500 })
  }
}
