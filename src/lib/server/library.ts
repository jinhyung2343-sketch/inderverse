import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { getPublicArtworkById } from '@/lib/server/explore'

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

  const artworks = await Promise.all(
    savedArtworkIds.map((artworkId) => getPublicArtworkById(artworkId))
  )

  return artworks.filter((artwork): artwork is NonNullable<typeof artwork> => artwork !== null)
}
