import Link from 'next/link'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { DeleteToonWorkButton } from '@/components/studio/DeleteToonWorkButton'
import { getAgeRatingLabel } from '@/lib/content-rating'
import { getCreatorSparkList } from '@/lib/server/spark'
import { getCreatorWebtoonList } from '@/lib/server/webtoon-studio'
import { getSparkFormatLabel, getSparkStatusLabel } from '@/lib/spark'
import { getWebtoonStatusLabel } from '@/lib/webtoon'

const webtoonFormats = [
  {
    href: '/main/studio/channels/webtoon/new',
    label: '연재 툰',
    description: '여러 회차와 컷 이미지를 쌓아가는 기본 툰 연재 형식입니다.',
  },
  {
    href: '/main/studio/channels/webtoon/short/new',
    label: '단편 툰',
    description: '한 편 또는 짧은 묶음으로 완결되는 단편 만화 형식입니다.',
  },
  {
    href: '/main/studio/channels/spark/new',
    label: '스파크',
    description: '단독 컷이나 4컷처럼 짧고 빠르게 공개하는 만화형 포맷입니다.',
  },
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

export default async function ToonBottegaPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>
}) {
  const { deleted } = await searchParams
  const [webtoonChannels, sparkChannels] = await Promise.all([
    getCreatorWebtoonList(),
    getCreatorSparkList(),
  ])
  const toonWorks = [
    ...webtoonChannels.map((channel) => ({
      id: channel.id,
      title: channel.title,
      href: `/main/studio/channels/webtoon/${channel.id}/edit`,
      coverImageUrl: channel.coverImageUrl,
      category: channel.category,
      kindLabel: '연재 툰',
      statusLabel: getWebtoonStatusLabel(channel.status),
      ageRatingLabel: getAgeRatingLabel(channel.ageRating),
      workType: 'webtoon' as const,
      itemSummary: `회차 ${channel.episodeCount}개`,
      summary: '이미지 회차 기반 연재 작품',
      updatedAt: channel.updatedAt,
    })),
    ...sparkChannels.map((spark) => ({
      id: spark.id,
      title: spark.title,
      href: `/main/studio/channels/spark/${spark.id}/edit`,
      coverImageUrl: spark.coverImageUrl,
      category: spark.topic,
      kindLabel: '스파크',
      statusLabel: getSparkStatusLabel(spark.status),
      ageRatingLabel: getAgeRatingLabel(spark.ageRating),
      workType: 'spark' as const,
      itemSummary: getSparkFormatLabel(spark.format),
      summary: spark.caption,
      updatedAt: spark.updatedAt,
    })),
  ].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <PageBackLink href="/main" ariaLabel="허브로 돌아가기" showLabel />
            <Link
              href="/main/studio/creator-channel"
              className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              공개 프로필 설정
            </Link>
          </div>

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">My Bottega / Toon</p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">Toon Bottega</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              툰 장르를 선택한 작가의 개인 공방입니다. 그림 업로드, 컷 편집, 회차 공개 흐름을 이 작업실에서 관리합니다.
            </p>
          </div>
        </header>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Toon Style</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">어떤 툰을 만들까요?</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {webtoonFormats.map((format) => (
              <Link
                key={format.href}
                href={format.href}
                className="rounded-lg border border-white/10 bg-white/[0.06] p-6 transition hover:border-white/25 hover:bg-white/[0.09]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Style</p>
                <h3 className="mt-3 text-2xl font-black tracking-tight">{format.label}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{format.description}</p>
                <p className="mt-6 text-sm font-semibold text-white">이 스타일로 시작하기</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Works</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">툰 작업물</h2>
          </div>

          {deleted === '1' ? (
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              작품을 삭제했습니다.
            </div>
          ) : null}

          {toonWorks.length > 0 ? (
            <div className="grid gap-3">
              {toonWorks.map((work) => (
                <article
                  key={`${work.kindLabel}-${work.id}`}
                  className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-4 transition hover:border-white/25 hover:bg-white/[0.085] md:grid-cols-[88px_1fr_auto] md:items-center"
                >
                  <Link href={work.href} aria-label={`${work.title} 편집`}>
                    <div
                      className="flex aspect-[4/5] w-full items-end rounded-md border border-white/10 bg-zinc-900 bg-cover bg-center p-3 md:w-[88px]"
                      style={work.coverImageUrl ? { backgroundImage: `url(${work.coverImageUrl})` } : undefined}
                    >
                      {!work.coverImageUrl ? <span className="text-2xl font-black text-zinc-500">툰</span> : null}
                    </div>
                  </Link>

                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">{work.kindLabel}</span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">{work.statusLabel}</span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">{work.ageRatingLabel}</span>
                    </div>
                    <h3 className="mt-3 truncate text-xl font-bold text-white">
                      <Link href={work.href} className="transition hover:text-zinc-200">
                        {work.title}
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                      {work.category} · {work.itemSummary} · {work.summary}
                    </p>
                  </div>

                  <div className="flex flex-row items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-zinc-400 md:flex-col md:items-end md:border-t-0 md:pt-0">
                    <span>{formatUpdatedAt(work.updatedAt)}</span>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Link href={work.href} className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200">
                        편집
                      </Link>
                      <DeleteToonWorkButton
                        channelId={work.id}
                        title={work.title}
                        workType={work.workType}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-sm leading-6 text-zinc-400">
              아직 만든 툰 작업물이 없습니다. 연재, 단편, 스파크 중 하나를 선택하면 이곳에서 계속 관리할 수 있습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
