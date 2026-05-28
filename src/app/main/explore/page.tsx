import { connection } from 'next/server'
import { ExploreClientPage } from '@/components/explore/ExploreClientPage'
import { getPublicArtworkList } from '@/lib/server/explore'
import { getPublicCreatorChannelList } from '@/lib/server/public-creator-channels'
import { getViewerSession } from '@/lib/server/viewer-session'

export const revalidate = 120

type ExplorePageSearchParams = Promise<{
  view?: string | string[]
}>

function getInitialExploreView(searchParams: Awaited<ExplorePageSearchParams>) {
  const view = Array.isArray(searchParams.view) ? searchParams.view[0] : searchParams.view

  return view === 'creators' ? 'creators' : 'works'
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: ExplorePageSearchParams
}) {
  await connection()
  const initialView = getInitialExploreView(await searchParams)
  const viewer = await getViewerSession()
  const visibility = {
    includeAdultContent: viewer.isAdultVerified,
    viewerId: viewer.userId,
  }
  const [artworks, creators] = await Promise.all([
    getPublicArtworkList(visibility),
    getPublicCreatorChannelList(visibility),
  ])

  return (
    <ExploreClientPage
      key={initialView}
      initialArtworks={artworks}
      initialCreators={creators}
      initialView={initialView}
    />
  )
}
