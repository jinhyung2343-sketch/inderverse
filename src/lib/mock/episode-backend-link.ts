import type { ArtworkEpisode, ExploreArtwork } from '@/lib/mock/explore-data'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface EpisodeBackendReference {
  backendEpisodeId?: string
  backendChannelId?: string
  episodeNumber: number | null
}

export function isUuid(value?: string | null) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

export function getEpisodeNumberFromId(episodeId: string) {
  const match = episodeId.match(/(\d+)$/)

  if (!match) {
    return null
  }

  return Number.parseInt(match[1], 10)
}

export function getEpisodeReference(episode: ArtworkEpisode): EpisodeBackendReference {
  return {
    backendEpisodeId: isUuid(episode.backendEpisodeId) ? episode.backendEpisodeId : undefined,
    backendChannelId: isUuid(episode.backendChannelId) ? episode.backendChannelId : undefined,
    episodeNumber: getEpisodeNumberFromId(episode.id),
  }
}

export function hasServerEpisodeLink(episode: ArtworkEpisode) {
  const reference = getEpisodeReference(episode)

  return Boolean(
    reference.backendEpisodeId ||
      (reference.backendChannelId && typeof reference.episodeNumber === 'number')
  )
}

export function getArtworkBackendCoverage(artwork: ExploreArtwork) {
  const linkedCount = artwork.episodes.filter(hasServerEpisodeLink).length

  return {
    linkedCount,
    totalCount: artwork.episodes.length,
    hasAnyLink: linkedCount > 0,
    isFullyLinked: linkedCount === artwork.episodes.length,
  }
}
