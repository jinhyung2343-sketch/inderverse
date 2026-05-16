import { ExploreClientPage } from '@/components/explore/ExploreClientPage'
import { getPublicArtworkList } from '@/lib/server/explore'
import { getPublicCreatorChannelList } from '@/lib/server/public-creator-channels'

export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  const [artworks, creators] = await Promise.all([
    getPublicArtworkList(),
    getPublicCreatorChannelList(),
  ])

  return (
    <ExploreClientPage
      initialArtworks={artworks}
      initialCreators={creators}
    />
  )
}
