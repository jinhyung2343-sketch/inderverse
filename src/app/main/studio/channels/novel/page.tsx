import Link from 'next/link'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getAgeRatingLabel } from '@/lib/content-rating'
import { getCreatorNovelList } from '@/lib/server/novel-studio'
import { getNovelStatusLabel } from '@/lib/novel'

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

export default async function NovelBottegaPage() {
  const novelChannels = await getCreatorNovelList()

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

          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">My Bottega / Novel</p>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">Novel Bottega</h1>
              <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
                소설 장르를 선택한 작가의 개인 공방입니다. 작품 기본 정보, 회차 본문, 공개 상태를 이 흐름 안에서 관리합니다.
              </p>
            </div>
            <Link
              href="/main/studio/channels/novel/new"
              className="inline-flex min-h-11 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              새 소설 만들기
            </Link>
          </div>
        </header>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Works</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">소설 작업물</h2>
          </div>

          {novelChannels.length > 0 ? (
            <div className="grid gap-3">
              {novelChannels.map((novel) => (
                <Link
                  key={novel.id}
                  href={`/main/studio/channels/novel/${novel.id}/edit`}
                  className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-4 transition hover:border-white/25 hover:bg-white/[0.085] md:grid-cols-[88px_1fr_auto] md:items-center"
                >
                  <div
                    className="flex aspect-[4/5] w-full items-end rounded-md border border-white/10 bg-zinc-900 bg-cover bg-center p-3 md:w-[88px]"
                    style={novel.coverImageUrl ? { backgroundImage: `url(${novel.coverImageUrl})` } : undefined}
                  >
                    {!novel.coverImageUrl ? <span className="text-2xl font-black text-zinc-500">소</span> : null}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">소설</span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                        {getNovelStatusLabel(novel.status)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                        {getAgeRatingLabel(novel.ageRating)}
                      </span>
                    </div>
                    <h3 className="mt-3 truncate text-xl font-bold text-white">{novel.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                      {novel.category} · 회차 {novel.episodeCount}개 · 텍스트 회차 기반 연재 작품
                    </p>
                  </div>

                  <div className="flex flex-row items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-zinc-400 md:flex-col md:items-end md:border-t-0 md:pt-0">
                    <span>{formatUpdatedAt(novel.updatedAt)}</span>
                    <span className="font-semibold text-white">편집하기</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-sm leading-6 text-zinc-400">
              아직 만든 소설이 없습니다. 첫 작업물을 만들면 이곳에서 회차와 공개 상태를 관리할 수 있습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
