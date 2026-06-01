import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { LibraryToggleButton } from '@/components/library/LibraryToggleButton'
import { ArtworkEpisodeList } from '@/components/episodes/ArtworkEpisodeList'
import { getArtworkBackendCoverage } from '@/lib/mock/episode-backend-link'
import { getPublicArtworkById } from '@/lib/server/explore'
import { getSavedArtworkIds } from '@/lib/server/library'
import { getViewerSession } from '@/lib/server/viewer-session'
import { getWorkTypeLabel } from '@/lib/work'

export const revalidate = 60

const sectionLinks = [
  { id: 'overview', label: '작품 소개' },
  { id: 'episodes', label: '회차 목록' },
  { id: 'comments', label: '댓글' },
]

export default async function ArtworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const viewer = await getViewerSession()
  const visibility = {
    includeAdultContent: viewer.isAdultVerified,
    viewerId: viewer.userId,
  }
  const artwork = await getPublicArtworkById(id, visibility)

  if (!artwork) {
    notFound()
  }

  const backendCoverage = getArtworkBackendCoverage(artwork)
  const savedArtworkIds = await getSavedArtworkIds()
  const savedArtworkId = artwork.backendChannelId ?? artwork.id
  const isSaved = savedArtworkIds.includes(savedArtworkId) || savedArtworkIds.includes(artwork.id)
  const firstEpisode = artwork.episodes[0] ?? null

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <PageBackLink href="/main/explore" ariaLabel="작품보기로 돌아가기" />

        <header className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_1.85fr]">
            <div
              className="min-h-[280px] bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(to top, rgba(5,5,5,0.7), rgba(5,5,5,0.15)), url(${artwork.coverImageUrl})` }}
            />

            <div className="flex flex-col gap-5 p-6 md:p-8">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                  {artwork.workType ? getWorkTypeLabel(artwork.workType) : '작품'} · {artwork.category}
                </p>
                <h1 className="text-4xl font-black tracking-tight">{artwork.title}</h1>
                <p className="text-sm text-zinc-400">
                  {artwork.creatorSlug ? (
                    <Link href={`/main/creators/${artwork.creatorSlug}`} className="transition hover:text-white">
                      {artwork.authorName}
                    </Link>
                  ) : (
                    artwork.authorName
                  )}{' '}
                  · {artwork.status === 'completed' ? '완결' : '연재중'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {artwork.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100">
                    #{tag}
                  </span>
                ))}
                {backendCoverage.totalCount > 0 ? (
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      backendCoverage.isFullyLinked
                        ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
                        : backendCoverage.hasAnyLink
                          ? 'border border-sky-400/20 bg-sky-500/10 text-sky-100'
                          : 'border border-white/10 bg-black/20 text-zinc-400'
                    }`}
                  >
                    {backendCoverage.isFullyLinked
                      ? '서버 연동 완료'
                      : backendCoverage.hasAnyLink
                        ? `부분 연동 ${backendCoverage.linkedCount}/${backendCoverage.totalCount}`
                        : '연결 대기'}
                  </span>
                ) : null}
              </div>

              <p className="max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">{artwork.summary}</p>

              <div className="flex flex-wrap gap-3">
                {firstEpisode ? (
                  <Link href={`/main/explore/${artwork.id}/episodes/${firstEpisode.id}`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
                    첫 화 보기
                  </Link>
                ) : (
                  <span className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm text-zinc-500">
                    회차 준비 중
                  </span>
                )}
                <LibraryToggleButton artworkId={artwork.id} artworkTitle={artwork.title} initialSaved={isSaved} />
                {artwork.creatorSlug ? (
                  <Link
                    href={`/main/creators/${artwork.creatorSlug}`}
                    className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-100 transition hover:bg-cyan-500/15"
                  >
                    작가 채널 보기
                  </Link>
                ) : null}
                <a href="#overview" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10">
                  작품 정보 보기
                </a>
              </div>
            </div>
          </div>
        </header>

        <nav className="sticky top-4 z-20 overflow-x-auto rounded-full border border-white/10 bg-[#0b0b0b]/80 p-2 backdrop-blur-xl">
          <div className="flex min-w-max gap-2">
            {sectionLinks.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_1.95fr]">
          <aside className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">작품 정보</p>
            <div className="mt-5 grid gap-3 text-sm text-zinc-300">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  형식: {artwork.workType ? getWorkTypeLabel(artwork.workType) : '작품'}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">장르: {artwork.category}</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                작가:{' '}
                {artwork.creatorSlug ? (
                  <Link href={`/main/creators/${artwork.creatorSlug}`} className="underline underline-offset-4 transition hover:text-white">
                    {artwork.authorName}
                  </Link>
                ) : (
                  artwork.authorName
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">상태: {artwork.status === 'completed' ? '완결' : '연재중'}</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">댓글: {artwork.isCommentEnabled ? '활성화' : '비활성화'}</div>
              {backendCoverage.totalCount > 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  연동 상태: {backendCoverage.hasAnyLink ? `${backendCoverage.linkedCount}/${backendCoverage.totalCount}화 서버 준비` : '연결 대기'}
                </div>
              ) : null}
            </div>
          </aside>

          <div className="grid gap-4">
            <section id="overview" className="scroll-mt-24 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Overview</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">작품 소개</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-300 md:text-base">{artwork.intro}</p>
            </section>

            <section id="episodes" className="scroll-mt-24 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Episodes</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">회차 목록</h2>
                </div>
                <span className="text-sm text-zinc-400">{artwork.episodes.length}화 준비</span>
              </div>

              <ArtworkEpisodeList artworkId={artwork.id} episodes={artwork.episodes} />
            </section>

            <section id="comments" className="scroll-mt-24 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Comments</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">댓글</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs ${artwork.isCommentEnabled ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border border-white/10 bg-black/20 text-zinc-400'}`}>
                  {artwork.isCommentEnabled ? '열림' : '닫힘'}
                </span>
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm leading-7 text-zinc-300">{artwork.commentPreview}</p>
              </div>
            </section>

          </div>
        </section>
      </div>
    </main>
  )
}
