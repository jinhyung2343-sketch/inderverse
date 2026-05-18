import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { getPublicArtworkList } from '@/lib/server/explore'
import type { ExploreArtwork } from '@/lib/explore'

export async function getSavedArtworkIds() {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.warn('Unable to read viewer session for library:', authError)
    return []
  }

  const user = authData.user

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('artwork_saves')
    .select('artwork_id')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  if (error) {
    console.warn('Unable to load saved artwork ids:', error)
    return []
  }

  return (data ?? []).map((entry) => entry.artwork_id)
}

export async function getSavedArtworks() {
  const savedArtworkIds = await getSavedArtworkIds()
  const artworks = await getPublicArtworkList()
  const artworkBySavedId = new Map<string, ExploreArtwork>()

  artworks.forEach((artwork) => {
    artworkBySavedId.set(artwork.id, artwork)

    if (artwork.backendChannelId) {
      artworkBySavedId.set(artwork.backendChannelId, artwork)
    }
  })

  const seenArtworkIds = new Set<string>()

  return savedArtworkIds.flatMap((artworkId) => {
    const artwork = artworkBySavedId.get(artworkId)

    if (!artwork || seenArtworkIds.has(artwork.id)) {
      return []
    }

    seenArtworkIds.add(artwork.id)
    return [artwork]
  })
}
