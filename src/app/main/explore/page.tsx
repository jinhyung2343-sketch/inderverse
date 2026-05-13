import { ExploreClientPage } from '@/components/explore/ExploreClientPage'
import { getPublicArtworkList } from '@/lib/server/explore'
import { getPublicCreatorChannelList } from '@/lib/server/public-creator-channels'

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const [{ view }, artworks, creators] = await Promise.all([
    searchParams,
    getPublicArtworkList(),
    getPublicCreatorChannelList(),
  ])

  return (
    <ExploreClientPage
      initialArtworks={artworks}
      initialCreators={creators}
      initialView={view === 'creators' ? 'creators' : 'works'}
    />
  )
}
