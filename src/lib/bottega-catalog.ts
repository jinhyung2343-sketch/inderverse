import type { PrimaryBottegaWorkType } from '@/lib/bottega'

export type BottegaGenreOption = {
  id: PrimaryBottegaWorkType | 'multi_artist'
  workType?: PrimaryBottegaWorkType
  title: string
  role: string
  description: string
  note: string
  isReady: boolean
  accentClassName: string
}

export const bottegaGenres: BottegaGenreOption[] = [
  {
    id: 'webtoon',
    workType: 'webtoon',
    title: 'Toon Bottega',
    role: '툰',
    description: '그림 업로드, 컷 편집, 회차 공개처럼 이미지 기반 창작에 맞춘 개인 공방입니다.',
    note: '연재, 단편, 스파크 스타일을 관리합니다.',
    isReady: true,
    accentClassName: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  },
  {
    id: 'novel',
    workType: 'novel',
    title: 'Novel Bottega',
    role: '소설',
    description: '본문, 회차 가격, 연재 상태, 표지와 태그를 중심으로 이야기를 쌓는 개인 공방입니다.',
    note: '소설 작업물 생성과 회차 본문 관리를 연결합니다.',
    isReady: true,
    accentClassName: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
  },
  {
    id: 'music',
    workType: 'music',
    title: 'Music Bottega',
    role: '음악',
    description: '트랙, 앨범, 가사, 뮤비 공개와 플레이어 중심 대시보드를 준비합니다.',
    note: '음원 업로드, 앨범형 작품, 공개 파라미터는 다음 단계에서 열립니다.',
    isReady: false,
    accentClassName: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  },
  {
    id: 'illustration',
    workType: 'illustration',
    title: 'Illustration Bottega',
    role: '그림',
    description: '단일 이미지, 시리즈, 포트폴리오형 공개 작품을 담는 시각 작업실입니다.',
    note: '이미지 보드, 시리즈 묶음, 공개 갤러리는 준비 중입니다.',
    isReady: false,
    accentClassName: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
  },
  {
    id: 'audio_drama',
    workType: 'audio_drama',
    title: 'Audio Bottega',
    role: '오디오',
    description: '성우, 대본, 시즌형 회차, 오디오 파일을 함께 운영하는 작업실입니다.',
    note: '오디오 회차와 시즌 관리는 이후 확장됩니다.',
    isReady: false,
    accentClassName: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
  },
  {
    id: 'essay',
    workType: 'essay',
    title: 'Essay Bottega',
    role: '에세이',
    description: '짧은 글, 연재 에세이, 창작 노트를 독자에게 공개하는 작업실입니다.',
    note: '텍스트 중심이지만 소설과 다른 공개 형식으로 분리할 예정입니다.',
    isReady: false,
    accentClassName: 'border-lime-300/25 bg-lime-400/10 text-lime-100',
  },
  {
    id: 'other',
    workType: 'other',
    title: 'Original Bottega',
    role: '독립 창작',
    description: '정해진 형식에 들어오지 않는 독립 창작물을 위한 작업실을 준비합니다.',
    note: '작품 구조가 명확해지는 형식부터 순차적으로 지원합니다.',
    isReady: false,
    accentClassName: 'border-zinc-300/25 bg-zinc-400/10 text-zinc-100',
  },
  {
    id: 'multi_artist',
    title: 'Multi Bottega',
    role: '멀티 아티스트',
    description: '여러 창작 정체성이 공존하는 작가를 위한 복합 공방입니다.',
    note: '프로젝트, 장르 섹션, 협업 흐름까지 별도 구조로 설계합니다.',
    isReady: false,
    accentClassName: 'border-white/25 bg-white/10 text-white',
  },
]
