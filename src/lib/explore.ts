export type ArtworkStatus = 'publishing' | 'completed'
export type EpisodeAccessState = 'free' | 'locked' | 'coming_soon'

export interface ArtworkEpisode {
  id: string
  backendEpisodeId?: string
  backendChannelId?: string
  workType?: 'webtoon' | 'novel'
  title: string
  accessState: EpisodeAccessState
  accessLabel: string
  coinPrice?: number
  preview: string
  body: string[]
  imageUrls?: string[]
}

export interface ExploreArtwork {
  id: string
  backendChannelId?: string
  workType?: 'webtoon' | 'novel'
  title: string
  authorName: string
  authorAvatarUrl?: string | null
  creatorSlug?: string | null
  coverImageUrl: string
  status: ArtworkStatus
  isAdultOnly: boolean
  isCommentEnabled: boolean
  category: string
  filterTags: string[]
  tags: string[]
  blurb: string
  summary: string
  intro: string
  commentPreview: string
  totalEpisodes?: number
  workScale?: 'short' | 'medium' | 'long'
  teaserPercentage?: number
  maxFreeEpisode?: number
  isFreeArchive?: boolean
  episodes: ArtworkEpisode[]
}

export const categories = ['전체', '드라마', '판타지', '로맨스', '액션', 'SF', '무협', '스릴러', '공포', '코믹', 'BL', 'GL']

export const quickFilters = ['추천', '최신', '인기', '완결', '맛보기 공개']

export const categoryTags: Record<string, string[]> = {
  전체: ['에디터 픽', '세계관 중심', '입문 추천', '강한 몰입감'],
  드라마: ['현실 서사', '성장', '감정선', '가족'],
  판타지: ['이세계', '마법', '왕국', '모험'],
  로맨스: ['관계 중심', '재회', '서서히', '캠퍼스'],
  액션: ['추격전', '복수', '생존', '하드보일드'],
  SF: ['우주', 'AI', '디스토피아', '시간'],
  무협: ['강호', '문파', '수련', '비급'],
  스릴러: ['추적', '반전', '심리전', '밀실'],
  공포: ['괴담', '오컬트', '폐쇄공간', '심령'],
  코믹: ['일상개그', '병맛', '가벼움', '캐릭터성'],
  BL: ['서사 중심', '긴장감', '관계 변화', '감정 폭발'],
  GL: ['섬세한 감정', '청춘', '서로의 구원', '여운'],
}

export function getEpisodePublicId(episodeNumber: number) {
  return `ep-${episodeNumber}`
}

export function getEpisodeById(artwork: ExploreArtwork, episodeId: string) {
  return artwork.episodes.find((episode) => episode.id === episodeId)
}
