import type { WorkType } from '@/lib/work'

export type PrimaryBottegaWorkType = Extract<
  WorkType,
  'webtoon' | 'novel' | 'music' | 'illustration' | 'audio_drama' | 'essay' | 'other'
>

export const PRIMARY_BOTTEGA_WORK_TYPES = [
  'webtoon',
  'novel',
  'music',
  'illustration',
  'audio_drama',
  'essay',
  'other',
] as const satisfies readonly PrimaryBottegaWorkType[]

export const READY_BOTTEGA_WORK_TYPES = ['webtoon', 'novel'] as const satisfies readonly PrimaryBottegaWorkType[]

export function isPrimaryBottegaWorkType(value: string): value is PrimaryBottegaWorkType {
  return (PRIMARY_BOTTEGA_WORK_TYPES as readonly string[]).includes(value)
}

export function isReadyBottegaWorkType(value: string): value is (typeof READY_BOTTEGA_WORK_TYPES)[number] {
  return (READY_BOTTEGA_WORK_TYPES as readonly string[]).includes(value)
}

export function getBottegaHref(workType: PrimaryBottegaWorkType | null | undefined) {
  switch (workType) {
    case 'webtoon':
      return '/main/studio/channels/webtoon'
    case 'novel':
      return '/main/studio/channels/novel'
    default:
      return '/main/studio/channels/webtoon'
  }
}

export function getBottegaLabel(workType: PrimaryBottegaWorkType | null | undefined) {
  switch (workType) {
    case 'webtoon':
      return 'Toon Bottega'
    case 'novel':
      return 'Novel Bottega'
    case 'music':
      return 'Music Bottega'
    case 'illustration':
      return 'Illustration Bottega'
    case 'audio_drama':
      return 'Audio Bottega'
    case 'essay':
      return 'Essay Bottega'
    case 'other':
      return 'Original Bottega'
    default:
      return 'My Bottega'
  }
}
