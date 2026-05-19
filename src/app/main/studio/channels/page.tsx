import { selectPrimaryBottega } from '@/app/main/studio/channels/actions'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getBottegaHref } from '@/lib/bottega'
import { ensureDefaultCreatorChannel } from '@/lib/server/creator-channels'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { PrimaryBottegaWorkType } from '@/lib/bottega'

type BottegaGenreOption = {
  id: PrimaryBottegaWorkType | 'multi_artist'
  workType?: PrimaryBottegaWorkType
  title: string
  role: string
  description: string
  note: string
  isReady: boolean
  accentClassName: string
}

const bottegaGenres: BottegaGenreOption[] = [
  {
    id: 'webtoon',
    workType: 'webtoon',
    title: 'Toon Bottega',
    role: '툰',
    description: '그림 업로드, 컷 편집, 회차 공개처럼 이미지 기반 창작에 맞춘 개인 공방입니다.',
    note: '선택 후 연재, 단편, 스파크 중 한 번 더 스타일을 고릅니다.',
    isReady: true,
    accentClassName: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  },
  {
    id: 'novel',
    workType: 'novel',
    title: 'Novel Bottega',
    role: '소설',
    description: '본문, 회차 가격, 연재 상태, 표지와 태그를 중심으로 이야기를 쌓는 개인 공방입니다.',
    note: '선택 후 소설 작업물 생성과 회차 본문 관리로 이어집니다.',
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
    description: '그림을 그리는 뮤지션, 음악을 하는 소설가처럼 여러 정체성이 공존하는 공방입니다.',
    note: '프로젝트, 장르 섹션, 협업 흐름까지 별도 구조로 설계합니다.',
    isReady: false,
    accentClassName: 'border-white/25 bg-white/10 text-white',
  },
]

export default async function BottegaGenreSelectPage({
  searchParams,
}: {
  searchParams?: Promise<{ setup?: string }>
}) {
  const params = await searchParams
  const isRegistrationSetup = params?.setup === '1'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && !isRegistrationSetup) {
    const channel = await ensureDefaultCreatorChannel(user.id)
    redirect(getBottegaHref(channel.primaryWorkType))
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <PageBackLink href="/main" ariaLabel="허브로 돌아가기" showLabel />

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Choose Genre</p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">어떤 Bottega를 열까요?</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              작가 등록 다음 단계입니다. 여기서 고른 예술 장르가 My Bottega의 도구, 대시보드, 제작 흐름을 결정합니다.
            </p>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {bottegaGenres.map((genre) =>
            genre.isReady && genre.workType ? (
              <form
                key={genre.id}
                action={selectPrimaryBottega}
                className="group flex min-h-[260px] flex-col rounded-lg border border-white/10 bg-white/[0.06] p-5 transition hover:border-white/25 hover:bg-white/[0.09]"
              >
                <input type="hidden" name="workType" value={genre.workType} />
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${genre.accentClassName}`}>
                    선택 가능
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{genre.role}</span>
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight">{genre.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{genre.description}</p>
                <p className="mt-3 text-xs leading-5 text-zinc-500">{genre.note}</p>
                <button type="submit" className="mt-auto pt-6 text-left text-sm font-semibold text-white">
                  이 장르로 My Bottega 열기
                </button>
              </form>
            ) : (
              <div
                key={genre.id}
                className="flex min-h-[260px] flex-col rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${genre.accentClassName}`}>
                    준비 중
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">{genre.role}</span>
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight text-zinc-300">{genre.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500">{genre.description}</p>
                <p className="mt-3 text-xs leading-5 text-zinc-600">{genre.note}</p>
                <p className="mt-auto pt-6 text-sm font-semibold text-zinc-500">나중에 열릴 Bottega</p>
              </div>
            )
          )}
        </section>
      </div>
    </main>
  )
}
