import Link from 'next/link'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getAgeRatingLabel } from '@/lib/content-rating'
import { getCreatorNovelList } from '@/lib/server/novel-studio'
import { getCreatorSparkList } from '@/lib/server/spark'
import { getCreatorWebtoonList } from '@/lib/server/webtoon-studio'
import { getNovelStatusLabel } from '@/lib/novel'
import { getSparkFormatLabel, getSparkStatusLabel } from '@/lib/spark'
import { getWebtoonStatusLabel } from '@/lib/webtoon'
import type { WorkType } from '@/lib/work'

type SupportedStudioWorkType = Extract<WorkType, 'webtoon' | 'novel' | 'spark'>

interface StudioWork {
  id: string
  title: string
  workType: SupportedStudioWorkType
  workTypeLabel: string
  formatLabel: string | null
  href: string
  coverImageUrl: string | null
  category: string
  summary: string
  tags: string[]
  statusLabel: string
  ageRatingLabel: string
  itemSummary: string
  updatedAt: string
}

type CreationIdentityType = WorkType | 'multi_artist'

const creationOptions: Array<{
  id: CreationIdentityType
  workType?: WorkType
  title: string
  role: string
  description: string
  note: string
  href?: string
  actionLabel?: string
  isReady: boolean
  accentClassName: string
}> = [
  {
    id: 'webtoon',
    workType: 'webtoon',
    title: '웹툰 작가',
    role: 'Toon Creator',
    description: '연재 웹툰, 단편 웹툰, 스파크처럼 이미지 기반 만화 작품을 시작합니다.',
    note: '포맷 선택 후 원고 이미지와 회차 편집으로 이어집니다.',
    href: '/main/studio/channels/webtoon',
    actionLabel: '웹툰으로 시작하기',
    isReady: true,
    accentClassName: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  },
  {
    id: 'novel',
    workType: 'novel',
    title: '웹소설 작가',
    role: 'Novel Creator',
    description: '텍스트 본문, 회차 가격, 연재 상태를 중심으로 장편 이야기를 쌓아갑니다.',
    note: '작품 정보를 저장한 뒤 회차 본문과 등급 설정으로 이어집니다.',
    href: '/main/studio/channels/novel/new',
    actionLabel: '웹소설로 시작하기',
    isReady: true,
    accentClassName: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
  },
  {
    id: 'music',
    workType: 'music',
    title: '음악가',
    role: 'Music Creator',
    description: '트랙, 앨범, 가사, 음원 자산을 작품 단위로 공개하는 구조를 준비합니다.',
    note: '음원 업로드와 앨범형 작품 관리는 다음 단계에서 열립니다.',
    isReady: false,
    accentClassName: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  },
  {
    id: 'illustration',
    workType: 'illustration',
    title: '일러스트레이터',
    role: 'Illustration Creator',
    description: '단일 이미지, 시리즈, 포트폴리오형 공개 작품을 담는 흐름을 준비합니다.',
    note: '작품 이미지, 시리즈 묶음, 공개 갤러리는 준비 중입니다.',
    isReady: false,
    accentClassName: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
  },
  {
    id: 'audio_drama',
    workType: 'audio_drama',
    title: '오디오 드라마 제작자',
    role: 'Audio Drama Creator',
    description: '성우, 대본, 시즌형 회차, 오디오 파일을 함께 운영하는 형식을 준비합니다.',
    note: '오디오 회차와 시즌 관리는 이후 확장됩니다.',
    isReady: false,
    accentClassName: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
  },
  {
    id: 'essay',
    workType: 'essay',
    title: '에세이스트',
    role: 'Essay Creator',
    description: '짧은 글, 연재 에세이, 창작 노트를 독자에게 공개하는 구조를 준비합니다.',
    note: '텍스트 중심이지만 웹소설과 다른 공개 형식으로 분리할 예정입니다.',
    isReady: false,
    accentClassName: 'border-lime-300/25 bg-lime-400/10 text-lime-100',
  },
  {
    id: 'other',
    workType: 'other',
    title: '기타 창작자',
    role: 'Original Creator',
    description: '정해진 형식에 들어오지 않는 독립 창작물을 위한 공간을 준비합니다.',
    note: '작품 구조가 명확해지는 형식부터 순차적으로 지원합니다.',
    isReady: false,
    accentClassName: 'border-zinc-300/25 bg-zinc-400/10 text-zinc-100',
  },
  {
    id: 'multi_artist',
    title: '멀티 아티스트',
    role: 'Multi Artist',
    description: '그림을 그리는 뮤지션, 음악을 하는 소설가처럼 여러 정체성이 공존하는 창작자를 위한 채널입니다.',
    note: '멀티 채널은 프로젝트, 장르 섹션, 협업 흐름까지 별도 구조로 설계합니다.',
    isReady: false,
    accentClassName: 'border-white/25 bg-white/10 text-white',
  },
]

const platformModel = [
  '작가는 먼저 자기 창작 정체성을 고르고, 선택한 형식에 맞는 제작 화면으로 이동합니다.',
  '작품은 work_type으로 구분하고, 회차와 자산은 형식에 맞는 편집기를 붙입니다.',
  '멀티 아티스트는 여러 장르를 한 채널에서 운영하는 별도 채널 구조로 확장합니다.',
]

function formatUpdatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '최근 수정일 미확인'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export default async function StudioChannelsPage() {
  const [webtoonChannels, novelChannels, sparkChannels] = await Promise.all([
    getCreatorWebtoonList(),
    getCreatorNovelList(),
    getCreatorSparkList(),
  ])

  const works: StudioWork[] = [
    ...webtoonChannels.map((channel) => ({
      id: channel.id,
      title: channel.title,
      workType: 'webtoon' as const,
      workTypeLabel: '웹툰',
      formatLabel: '연재 웹툰',
      href: `/main/studio/channels/webtoon/${channel.id}/edit`,
      coverImageUrl: channel.coverImageUrl,
      category: channel.category,
      summary: '이미지 회차 기반 연재 작품',
      tags: channel.tags,
      statusLabel: getWebtoonStatusLabel(channel.status),
      ageRatingLabel: getAgeRatingLabel(channel.ageRating),
      itemSummary: `회차 ${channel.episodeCount}개`,
      updatedAt: channel.updatedAt,
    })),
    ...novelChannels.map((channel) => ({
      id: channel.id,
      title: channel.title,
      workType: 'novel' as const,
      workTypeLabel: '웹소설',
      formatLabel: null,
      href: `/main/studio/channels/novel/${channel.id}/edit`,
      coverImageUrl: channel.coverImageUrl,
      category: channel.category,
      summary: '텍스트 회차 기반 연재 작품',
      tags: channel.tags,
      statusLabel: getNovelStatusLabel(channel.status),
      ageRatingLabel: getAgeRatingLabel(channel.ageRating),
      itemSummary: `회차 ${channel.episodeCount}개`,
      updatedAt: channel.updatedAt,
    })),
    ...sparkChannels.map((spark) => ({
      id: spark.id,
      title: spark.title,
      workType: 'spark' as const,
      workTypeLabel: '웹툰',
      formatLabel: '스파크',
      href: `/main/studio/channels/spark/${spark.id}/edit`,
      coverImageUrl: spark.coverImageUrl,
      category: spark.topic,
      summary: spark.caption,
      tags: spark.tags,
      statusLabel: getSparkStatusLabel(spark.status),
      ageRatingLabel: getAgeRatingLabel(spark.ageRating),
      itemSummary: getSparkFormatLabel(spark.format),
      updatedAt: spark.updatedAt,
    })),
  ].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())

  const totalEpisodeWorks = webtoonChannels.length + novelChannels.length
  const comicWorksCount = webtoonChannels.length + sparkChannels.length

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <PageBackLink
              href="/main/studio/creator-channel"
              ariaLabel="내 채널 운영으로 돌아가기"
              label="내 채널 운영"
              showLabel
            />
            <Link
              href="/main/studio/creator-channel"
              className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              작가 채널 설정
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">새 작품 만들기</h1>
              <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
                먼저 어떤 창작자로 시작할지 선택하세요. 지금은 웹툰과 웹소설을 열어두고, 나머지 장르는 준비 중입니다.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Works</p>
                <p className="mt-2 text-2xl font-black">{works.length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Series</p>
                <p className="mt-2 text-2xl font-black">{totalEpisodeWorks}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Types</p>
                <p className="mt-2 text-2xl font-black">2</p>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Creator Identity</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">어떤 창작자로 시작할까요?</h2>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link
                href="/main/studio/creator-channel"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-black/25 transition hover:bg-zinc-200"
              >
                내 채널 운영으로 돌아가기
              </Link>
              <p className="max-w-xl text-sm leading-6 text-zinc-400 md:text-right">
                선택은 이번 작품의 시작점입니다. 나중에 한 채널 안에서 여러 형식을 운영할 수 있도록 확장합니다.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {creationOptions.map((option) =>
              option.isReady && option.href ? (
                <Link
                  key={option.id}
                  href={option.href}
                  className="group flex min-h-[260px] flex-col rounded-lg border border-white/10 bg-white/[0.06] p-5 transition hover:border-white/25 hover:bg-white/[0.09]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${option.accentClassName}`}>
                      사용 가능
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {option.role}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-black tracking-tight">{option.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{option.description}</p>
                  <p className="mt-3 text-xs leading-5 text-zinc-500">{option.note}</p>
                  <p className="mt-auto pt-6 text-sm font-semibold text-white">{option.actionLabel}</p>
                </Link>
              ) : (
                <div
                  key={option.id}
                  className="flex min-h-[260px] flex-col rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${option.accentClassName}`}>
                      준비 중
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                      {option.role}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-black tracking-tight text-zinc-300">{option.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">{option.description}</p>
                  <p className="mt-3 text-xs leading-5 text-zinc-600">{option.note}</p>
                  <p className="mt-auto pt-6 text-sm font-semibold text-zinc-500">나중에 열릴 메뉴</p>
                </div>
              )
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Manage</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">작품 관리</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">웹툰 계열 {comicWorksCount}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                연재 웹툰 {webtoonChannels.length} · 스파크 {sparkChannels.length}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">웹소설 {novelChannels.length}</span>
            </div>
          </div>

          {works.length > 0 ? (
            <div className="grid gap-3">
              {works.map((work) => (
                <Link
                  key={`${work.workType}-${work.id}`}
                  href={work.href}
                  className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-4 transition hover:border-white/25 hover:bg-white/[0.085] md:grid-cols-[88px_1fr_auto] md:items-center"
                >
                  <div
                    className="flex aspect-[4/5] w-full items-end rounded-md border border-white/10 bg-zinc-900 bg-cover bg-center p-3 md:w-[88px]"
                    style={work.coverImageUrl ? { backgroundImage: `url(${work.coverImageUrl})` } : undefined}
                  >
                    {!work.coverImageUrl ? (
                      <span className="text-2xl font-black text-zinc-500">{work.workTypeLabel.slice(0, 1)}</span>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                        {work.workTypeLabel}
                      </span>
                      {work.formatLabel ? (
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">{work.formatLabel}</span>
                      ) : null}
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">{work.statusLabel}</span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">{work.ageRatingLabel}</span>
                    </div>
                    <h3 className="mt-3 truncate text-xl font-bold text-white">{work.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                      {work.category} · {work.itemSummary} · {work.summary}
                    </p>
                    {work.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                        {work.tags.slice(0, 4).map((tag) => (
                          <span key={`${work.id}-${tag}`}>#{tag}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-row items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-zinc-400 md:flex-col md:items-end md:border-t-0 md:pt-0">
                    <span>{formatUpdatedAt(work.updatedAt)}</span>
                    <span className="font-semibold text-white">편집하기</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-sm leading-6 text-zinc-400">
              아직 만든 작품이 없습니다. 웹툰이나 웹소설을 만들면 이곳에서 형식과 상태를 함께 관리할 수 있습니다.
            </div>
          )}
        </section>

        <section className="border-t border-white/10 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Structure</p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-400 md:grid-cols-3">
            {platformModel.map((item) => (
              <li key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
