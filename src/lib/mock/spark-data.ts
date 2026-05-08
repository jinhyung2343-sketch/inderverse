import { DEFAULT_RATING_CHECKLIST } from '@/lib/content-rating'
import type { SparkRecord } from '@/lib/spark'

export const sparkRecords: SparkRecord[] = [
  {
    id: 'spark-city-signals',
    title: '도시가 보내는 작은 신호',
    creatorName: '인더버스 편집부',
    format: 'single_cut',
    panelCount: 1,
    topic: '사회',
    caption: '매일 지나치는 표지판에도 도시의 우선순위가 숨어 있습니다.',
    summary: '사소한 생활 장면을 통해 도시가 누구에게 친절하고 누구에게 불친절한지 짚어보는 스파크입니다.',
    description:
      '출근길 횡단보도, 좁은 인도, 사라지는 의자처럼 작은 장면을 통해 도시의 설계가 사람의 하루에 어떤 압력을 주는지 보여줍니다.',
    ageRating: 'all',
    ratingChecklist: DEFAULT_RATING_CHECKLIST,
    punchline: '도시는 말이 없지만, 매일 같은 사람에게 먼저 비켜서라고 말한다.',
    tags: ['도시', '생활', '관찰'],
    tone: '차분한 풍자',
    externalUrl: null,
    coverImageUrl:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    panels: [],
    isAdultOnly: false,
    status: 'publishing',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'spark-four-cuts-feed',
    title: '알림이 쌓이는 밤',
    creatorName: '라진',
    format: 'four_cut',
    panelCount: 4,
    topic: '풍자',
    caption: '잠깐 확인하려던 피드가 밤 전체를 가져가는 순간.',
    summary: '짧은 4컷 흐름으로 피드, 알림, 수면 리듬 사이의 이상한 균형을 다룹니다.',
    description:
      '하나의 알림에서 시작해 끝없이 이어지는 피드 소비를 4컷 스트립으로 압축했습니다. 가볍지만 익숙해서 조금 따끔한 장면입니다.',
    ageRating: '12',
    ratingChecklist: {
      sexualContent: 'none',
      violence: 'none',
      language: 'low',
    },
    punchline: '오늘도 나는 쉬려고 누웠고, 알고리즘은 야근을 시켰다.',
    tags: ['피드', '알림', '수면'],
    tone: '가벼운 블랙코미디',
    externalUrl: null,
    coverImageUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    panels: [],
    isAdultOnly: false,
    status: 'publishing',
    createdAt: '2026-01-12T09:00:00.000Z',
    updatedAt: '2026-01-12T09:00:00.000Z',
  },
]

export function getSparkRecordById(id: string) {
  return sparkRecords.find((spark) => spark.id === id)
}
