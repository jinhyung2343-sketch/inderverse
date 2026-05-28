import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  isJsonObject,
  isValidWorkDraftKey,
  isWorkDraftType,
  toJsonCompatible,
} from '@/lib/work-drafts'
import type { Json } from '@/lib/supabase/types'

export const runtime = 'nodejs'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase, userId: null }
  }

  return { supabase, userId: user.id }
}

function parseDraftQuery(req: NextRequest) {
  const draftType = req.nextUrl.searchParams.get('draftType')
  const draftKey = req.nextUrl.searchParams.get('draftKey')

  if (!isWorkDraftType(draftType) || !isValidWorkDraftKey(draftKey)) {
    return null
  }

  return {
    draftType,
    draftKey: draftKey.trim(),
  }
}

export async function GET(req: NextRequest) {
  const { supabase, userId } = await getAuthenticatedUser()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const draft = parseDraftQuery(req)

  if (!draft) {
    return NextResponse.json({ error: 'Invalid draft request' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('creator_work_drafts')
    .select('draft_type, draft_key, payload, updated_at')
    .eq('owner_id', userId)
    .eq('draft_type', draft.draftType)
    .eq('draft_key', draft.draftKey)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ draft: null }, { status: 200 })
  }

  return NextResponse.json(
    {
      draft: {
        draftType: data.draft_type,
        draftKey: data.draft_key,
        payload: data.payload,
        updatedAt: data.updated_at,
      },
    },
    { status: 200 }
  )
}

export async function PUT(req: NextRequest) {
  const { supabase, userId } = await getAuthenticatedUser()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as {
    channelId?: unknown
    draftKey?: unknown
    draftType?: unknown
    episodeId?: unknown
    payload?: unknown
  }

  if (!isWorkDraftType(body.draftType) || !isValidWorkDraftKey(body.draftKey)) {
    return NextResponse.json({ error: 'Invalid draft request' }, { status: 400 })
  }

  const payload = toJsonCompatible(body.payload)

  if (!isJsonObject(payload)) {
    return NextResponse.json({ error: 'Invalid draft payload' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const channelId = typeof body.channelId === 'string' && body.channelId.trim() ? body.channelId.trim() : null
  const episodeId = typeof body.episodeId === 'string' && body.episodeId.trim() ? body.episodeId.trim() : null

  const { data, error } = await supabase
    .from('creator_work_drafts')
    .upsert(
      {
        owner_id: userId,
        draft_type: body.draftType,
        draft_key: body.draftKey.trim(),
        channel_id: channelId,
        episode_id: episodeId,
        payload: payload as Json,
        updated_at: now,
      },
      {
        onConflict: 'owner_id,draft_type,draft_key',
      }
    )
    .select('updated_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Draft save failed' }, { status: 500 })
  }

  return NextResponse.json({ updatedAt: data.updated_at }, { status: 200 })
}

export async function DELETE(req: NextRequest) {
  const { supabase, userId } = await getAuthenticatedUser()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    draftKey?: unknown
    draftType?: unknown
  } | null
  const draftType = body?.draftType ?? req.nextUrl.searchParams.get('draftType')
  const draftKey = body?.draftKey ?? req.nextUrl.searchParams.get('draftKey')

  if (!isWorkDraftType(draftType) || !isValidWorkDraftKey(draftKey)) {
    return NextResponse.json({ error: 'Invalid draft request' }, { status: 400 })
  }

  const { error } = await supabase
    .from('creator_work_drafts')
    .delete()
    .eq('owner_id', userId)
    .eq('draft_type', draftType)
    .eq('draft_key', draftKey.trim())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true }, { status: 200 })
}
