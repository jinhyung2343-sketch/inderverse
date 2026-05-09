import Link from 'next/link'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getAgeRatingLabel } from '@/lib/content-rating'
import { getCreatorNovelList } from '@/lib/server/novel-studio'
import { getCreatorSparkList } from '@/lib/server/spark'
import { getCreatorWebtoonList } from '@/lib/server/webtoon-studio'
import { getNovelStatusLabel } from '@/lib/novel'
import { getSparkFormatLabel, getSparkStatusLabel } from '@/lib/spark'
import { getWebtoonStatusLabel } from '@/lib/webtoon'
import { getWorkTypeLabel, type WorkType } from '@/lib/work'

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

const creationOptions: Array<{
  workType: WorkType
  title: string
  description: string
  href?: string
  actionLabel?: string
  isReady: boolean
}> = [
  {
    workType: 'webtoon',
    title: '웹툰',
    description: '연재 웹툰, 짧은 만화형 스파크 등 이미지 기반 만화 작품을 시작합니다.',
    href: '/main/studio/channels/webtoon',
    actionLabel: '웹툰 만들기',
    isReady: true,
  },
  {
    workType: 'novel',
    title: '웹소설',
    description: '텍스트 본문, 회차 가격, 연재 상태를 관리합니다.',
    href: '/main/studio/channels/novel/new',
    actionLabel: '웹소설 만들기',
    isReady: true,
  },
  {
    workType: 'audio_drama',
    title: '오디오 드라마',
    description: '오디오 파일과 시즌형 회차를 담을 수 있게 확장할 예정입니다.',
    isReady: false,
  },
  {
    workType: 'music',
    title: '음악',
    description: '트랙, 앨범, 가사와 음원 자산을 담을 수 있게 준비합니다.',
    isReady: false,
  },
  {
    workType: 'illustration',
    title: '일러스트',
    description: '단일 이미지, 시리즈, 포트폴리오 공개를 고려합니다.',
    isReady: false,
  },
]

const platformModel = [
  '작가는 먼저 공개 채널을 가지고, 그 안에서 여러 형식의 작품을 운영합니다.',
  '작품은 work_type으로 구분하고, 회차와 자산은 형식에 맞는 편집기를 붙입니다.',
  '알파에서는 웹툰과 웹소설을 실제 제작 대상으로 두고, 스파크는 웹툰 계열의 짧은 포맷으로 운영합니다.',
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
            <PageBackLink href="/main/studio" ariaLabel="스튜디오 홈으로 돌아가기" />
            <Link
              href="/main/studio/creator-channel"
              className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              작가 채널 설정
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">내 작품</h1>
              <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
                웹툰 계열과 웹소설을 한 화면에서 보고 형식에 맞는 편집기로 이어갑니다.
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
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Create</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">새 작품 만들기</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-zinc-400">
              지금은 웹툰 계열과 웹소설을 먼저 지원하고, 다른 형식은 같은 작품 구조 위에 순차적으로 붙입니다.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {creationOptions.map((option) =>
              option.href ? (
                <Link
                  key={option.workType}
                  href={option.href}
                  className="rounded-lg border border-white/10 bg-white/[0.06] p-4 transition hover:border-white/25 hover:bg-white/[0.09]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {getWorkTypeLabel(option.workType)}
                  </p>
                  <h3 className="mt-3 text-lg font-bold">{option.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{option.description}</p>
                  <p className="mt-4 text-xs font-semibold text-white">{option.actionLabel}</p>
                </Link>
              ) : (
                <div key={option.workType} className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                    {getWorkTypeLabel(option.workType)}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-zinc-300">{option.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{option.description}</p>
                  <p className="mt-4 text-xs font-semibold text-zinc-500">준비 중</p>
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
