import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { buildTrafficCostHeaders } from '@/lib/traffic-cost-control'
import { PUBLIC_CACHE_TAGS } from '@/lib/public-cache'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readInteger(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(readText(value), 10)
  return Number.isInteger(parsed) ? parsed : fallback
}

function isEpisodePricing(value: string): value is 'free' | 'paid' {
  return value === 'free' || value === 'paid'
}

function isEpisodeStatus(value: string): value is 'draft' | 'published' | 'hidden' {
  return value === 'draft' || value === 'published' || value === 'hidden'
}

function revalidatePublicContentCache() {
  revalidateTag(PUBLIC_CACHE_TAGS.artworks, 'max')
  revalidateTag(PUBLIC_CACHE_TAGS.creators, 'max')
  revalidateTag(PUBLIC_CACHE_TAGS.navigation, 'max')
  revalidateTag(PUBLIC_CACHE_TAGS.sparks, 'max')
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

    const payload = (await req.json()) as Record<string, unknown>
    const channelId = readText(payload.channelId)
    const title = readText(payload.title)
    const episodeNumber = readInteger(payload.episodeNumber)
    const pricingTypeValue = readText(payload.pricingType) || 'paid'
    const statusValue = readText(payload.status)
    const pendingImageCount = Math.max(0, readInteger(payload.pendingImageCount))

    if (!channelId) {
      return NextResponse.json({ error: '회차를 추가할 채널을 찾지 못했습니다.' }, { status: 400 })
    }

    if (!title || episodeNumber <= 0) {
      return NextResponse.json({ error: '회차 제목과 번호를 확인해 주세요.' }, { status: 400 })
    }

    if (!isEpisodePricing(pricingTypeValue)) {
      return NextResponse.json({ error: '유효하지 않은 가격 정책입니다.' }, { status: 400 })
    }

    if (!isEpisodeStatus(statusValue)) {
      return NextResponse.json({ error: '유효하지 않은 회차 상태입니다.' }, { status: 400 })
    }

    if (statusValue === 'published' && pendingImageCount === 0) {
      return NextResponse.json({ error: '공개 회차에는 최소 1장의 이미지가 필요합니다.' }, { status: 400 })
    }

    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('id, is_adult_only')
      .eq('id', channelId)
      .eq('creator_id', user.id)
      .eq('work_type', 'webtoon')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: '내 연재 툰에서만 회차를 만들 수 있습니다.' }, { status: 403 })
    }

    const publishedAt = statusValue === 'published' ? new Date().toISOString() : null
    const coinPrice =
      pricingTypeValue === 'free' ? 0 : Math.max(0, readInteger(payload.coinPrice, 7))

    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        channel_id: channelId,
        episode_number: episodeNumber,
        title,
        pricing_type: pricingTypeValue,
        coin_price: coinPrice,
        is_adult_only: channel.is_adult_only,
        status: statusValue,
        published_at: publishedAt,
      })
      .select('id')
      .single()

    if (episodeError || !episode) {
      return NextResponse.json(
        { error: episodeError?.message || '회차를 만들지 못했습니다.' },
        { status: 500 }
      )
    }

    revalidatePath('/main/explore')
    revalidatePath(`/main/explore/${channelId}`)
    revalidatePath(`/main/studio/channels/webtoon/${channelId}/edit`)
    revalidatePublicContentCache()

    return NextResponse.json(
      {
        episodeId: episode.id,
        editPath: `/main/studio/channels/webtoon/${channelId}/episodes/${episode.id}/edit`,
      },
      {
        status: 201,
        headers: buildTrafficCostHeaders('privateApi', { includeCacheControl: true }),
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('create webtoon episode api error:', message)
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: buildTrafficCostHeaders('privateApi', { includeCacheControl: true }),
      }
    )
  }
}
