import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type EpisodeRow = Pick<
  Database['public']['Tables']['episodes']['Row'],
  'id' | 'channel_id' | 'pricing_type'
>

interface EpisodeReferenceInput {
  episodeId?: string
  channelId?: string
  episodeNumber?: number
}

function isValidEpisodeNumber(value?: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

export async function resolveEpisodeReference(
  adminClient: SupabaseClient<Database>,
  input: EpisodeReferenceInput
): Promise<EpisodeRow | null> {
  if (typeof input.episodeId === 'string' && input.episodeId.trim().length > 0) {
    let query = adminClient
      .from('episodes')
      .select('id, channel_id, pricing_type')
      .eq('id', input.episodeId)

    if (typeof input.channelId === 'string' && input.channelId.trim().length > 0) {
      query = query.eq('channel_id', input.channelId)
    }

    const { data } = await query.single()
    return data
  }

  if (
    typeof input.channelId === 'string' &&
    input.channelId.trim().length > 0 &&
    isValidEpisodeNumber(input.episodeNumber)
  ) {
    const episodeNumber = input.episodeNumber

    const { data } = await adminClient
      .from('episodes')
      .select('id, channel_id, pricing_type')
      .eq('channel_id', input.channelId)
      .eq('episode_number', episodeNumber)
      .single()

    return data
  }

  return null
}
