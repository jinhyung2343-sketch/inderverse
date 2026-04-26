export type SparkFormat = 'single_cut' | 'four_cut'

export interface SparkWork {
  id: string
  title: string
  creatorName: string
  format: SparkFormat
  topic: string
  caption: string
  summary: string
  punchline: string
  tags: string[]
  accentClassName: string
}

export const sparkWorks: SparkWork[] = [
  {
    id: 'briefing-room',
    title: '브리핑룸의 정적',
    creatorName: '노아',
    format: 'single_cut',
    topic: '정치 풍자',
    caption: '말은 넘치는데 핵심은 늘 마이크 뒤에 숨는다.',
    summary: '정치 브리핑 한 장면을 한 컷으로 압축해, 말의 과잉과 책임의 공백을 동시에 비튼 Spark 카드입니다.',
    punchline: '모든 답변이 준비돼 있었지만, 질문만 빠져 있었다.',
    tags: ['브리핑', '정치', '한컷'],
    accentClassName: 'from-cyan-500/25 via-sky-500/10 to-transparent',
  },
  {
    id: 'campaign-coffee',
    title: '캠페인 커피 4컷',
    creatorName: '해일',
    format: 'four_cut',
    topic: '사회 풍자',
    caption: '약속은 뜨겁게 내려도, 식는 건 늘 가장 빠르다.',
    summary: '선거철 공약과 일상의 체감 온도 차이를 위트 있게 비트는 4컷 스트립 구조입니다.',
    punchline: '따뜻한 건 인사뿐이고, 남는 건 컵 홀더뿐.',
    tags: ['공약', '선거', '4컷'],
    accentClassName: 'from-amber-500/25 via-orange-500/10 to-transparent',
  },
  {
    id: 'portrait-mode',
    title: '인물 모드',
    creatorName: '윤슬',
    format: 'single_cut',
    topic: '인물 패러디',
    caption: '카메라는 얼굴을 또렷하게 잡지만, 말의 배경흐림은 못 막는다.',
    summary: '공적 인물의 이미지 소비 방식을 짧고 선명하게 비꼬는 단독 컷 포맷입니다.',
    punchline: '초점은 맞았는데, 맥락은 자동 보정에서 빠졌다.',
    tags: ['인물', '패러디', '짧은풍자'],
    accentClassName: 'from-rose-500/25 via-fuchsia-500/10 to-transparent',
  },
]
