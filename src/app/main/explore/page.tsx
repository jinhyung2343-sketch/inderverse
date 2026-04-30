import { ExploreClientPage } from '@/components/explore/ExploreClientPage'
import { getPublicArtworkList } from '@/lib/server/explore'

export default async function ExplorePage() {
  const artworks = await getPublicArtworkList()

  return <ExploreClientPage initialArtworks={artworks} />
}
