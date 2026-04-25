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

    const { episodeId } = await req.json()
    if (typeof episodeId !== 'string' || episodeId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid episode id' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient.rpc('purchase_episode', {
      p_user_id: user.id,
      p_episode_id: episodeId,
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
