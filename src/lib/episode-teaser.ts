import type { ArtworkEpisode, EpisodeAccessState } from '@/lib/explore'

export function normalizeTeaserPercentage(teaserPercentage: number) {
  return Math.min(20, Math.max(3, teaserPercentage))
}

export function getTeaserBody(body: string[], teaserPercentage: number) {
  if (body.length === 0) {
    return []
  }

  const normalizedText = body.join('\n\n').trim()
  if (!normalizedText) {
    return []
  }

  const characterLimit = Math.max(80, Math.ceil(normalizedText.length * (normalizeTeaserPercentage(teaserPercentage) / 100)))
  const teaserText = normalizedText.length > characterLimit
    ? `${normalizedText.slice(0, characterLimit).trimEnd()}...`
    : normalizedText

  return teaserText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export function getTeaserImageUrls(imageUrls: string[], teaserPercentage: number) {
  if (imageUrls.length === 0) {
    return []
  }

  const imageLimit = Math.max(1, Math.ceil(imageUrls.length * (normalizeTeaserPercentage(teaserPercentage) / 100)))

  return imageUrls.slice(0, imageLimit)
}

export function getReaderSafeEpisodePayload(
  episode: ArtworkEpisode,
  accessState: EpisodeAccessState,
  teaserPercentage: number
): ArtworkEpisode {
  if (accessState === 'free') {
    return episode
  }

  if (accessState === 'teaser') {
    return {
      ...episode,
      body: getTeaserBody(episode.body, teaserPercentage),
      imageUrls: getTeaserImageUrls(episode.imageUrls ?? [], teaserPercentage),
    }
  }

  return {
    ...episode,
    body: [],
    imageUrls: [],
  }
}

export function stripEpisodeReaderPayload(episode: ArtworkEpisode): ArtworkEpisode {
  return {
    ...episode,
    body: [],
    imageUrls: [],
  }
}
