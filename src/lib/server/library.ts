import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { artworks } from '@/lib/mock/explore-data'

export async function getSavedArtworkIds() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('artwork_saves')
    .select('artwork_id')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load saved artwork ids: ${error.message}`)
  }

  return (data ?? []).map((entry) => entry.artwork_id)
}

export async function getSavedArtworks() {
  const savedArtworkIds = await getSavedArtworkIds()
  const artworkById = new Map(artworks.map((artwork) => [artwork.id, artwork]))

  return savedArtworkIds
    .map((artworkId) => artworkById.get(artworkId))
    .filter((artwork): artwork is (typeof artworks)[number] => Boolean(artwork))
}
