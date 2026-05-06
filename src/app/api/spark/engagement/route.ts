import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getSparkEngagementSummary } from '@/lib/server/spark'

async function canAccessSparkChannel(channelId: string, userId: string | null) {
  const admin = createAdminClient()
  const { data: channel, error } = await admin
    .from('channels')
    .select('id, is_adult_only, status, work_type')
    .eq('id', channelId)
    .eq('work_type', 'spark')
    .in('status', ['publishing', 'completed'])
    .maybeSingle()

  if (error || !channel) {
    return false
  }

  if (!channel.is_adult_only) {
    return true
  }

  if (!userId) {
    return false
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('is_adult_verified')
    .eq('id', userId)
    .maybeSingle()

  return profile?.is_adult_verified === true
}

function getIpHash(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const fallback = request.headers.get('x-real-ip')?.trim()
  const source = forwardedFor || fallback

  if (!source) {
    return null
  }

  return createHash('sha256').update(source).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { sparkId, action, anonId } = await req.json()

    if (typeof sparkId !== 'string' || sparkId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid spark id' }, { status: 400 })
    }

    if (!['view', 'applause', 'toggle_save'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const canAccess = await canAccessSparkChannel(sparkId, user?.id ?? null)

    if (!canAccess) {
      return NextResponse.json({ error: 'Spark not accessible' }, { status: 403 })
    }

    const admin = createAdminClient()

    if (action === 'view') {
      const ipHash = getIpHash(req)
      await admin.from('spark_views').insert({
        channel_id: sparkId,
        user_id: user?.id ?? null,
        ip_hash: ipHash,
        anon_id: typeof anonId === 'string' ? anonId : null,
      })
    }

    if (action === 'applause') {
      if (!user) {
        return NextResponse.json({ error: 'Login required to react to sparks' }, { status: 401 })
      }

      await admin.from('spark_reactions').insert({
        channel_id: sparkId,
        user_id: user.id,
        reaction_type: 'applause',
        anon_id: typeof anonId === 'string' ? anonId : null,
      })
    }

    if (action === 'toggle_save') {
      if (!user) {
        return NextResponse.json({ error: 'Login required to save sparks' }, { status: 401 })
      }

      const { data: existingSave } = await supabase
        .from('spark_saves')
        .select('id')
        .eq('channel_id', sparkId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingSave) {
        const { error } = await supabase
          .from('spark_saves')
          .delete()
          .eq('id', existingSave.id)

        if (error) {
          throw error
        }
      } else {
        const { error } = await supabase
          .from('spark_saves')
          .insert({
            channel_id: sparkId,
            user_id: user.id,
          })

        if (error) {
          throw error
        }
      }
    }

    const summary = await getSparkEngagementSummary(sparkId)

    return NextResponse.json({ success: true, summary }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating spark engagement:', message)
    return NextResponse.json({ error: 'Spark engagement update failed' }, { status: 500 })
  }
}
