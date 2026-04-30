import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArtworkCard } from '@/components/ui/ArtworkCard'
import { LibraryToggleButton } from '@/components/library/LibraryToggleButton'
import { ArtworkEpisodeList } from '@/components/episodes/ArtworkEpisodeList'
import { artworks, getArtworkById } from '@/lib/mock/explore-data'
import { getArtworkBackendCoverage } from '@/lib/mock/episode-backend-link'
import { getSavedArtworkIds } from '@/lib/server/library'

const sectionLinks = [
  { id: 'overview', label: '작품 소개' },
  { id: 'episodes', label: '회차 목록' },
  { id: 'comments', label: '댓글' },
  { id: 'related', label: '추천작' },
]

export default async function ArtworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const artwork = getArtworkById(id)

  if (!artwork) {
    notFound()
  }

  const relatedArtworks = artworks
    .filter((item) => item.id !== artwork.id && (item.category === artwork.category || item.tags.some((tag) => artwork.tags.includes(tag))))
    .slice(0, 4)
  const backendCoverage = getArtworkBackendCoverage(artwork)
  const savedArtworkIds = await getSavedArtworkIds()
  const isSaved = savedArtworkIds.includes(artwork.id)

  const fallbackRelated = artworks.filter((item) => item.id !== artwork.id).slice(0, 4)
  const recommended = relatedArtworks.length > 0 ? relatedArtworks : fallbackRelated

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_1.85fr]">
            <div
              className="min-h-[280px] bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(to top, rgba(5,5,5,0.7), rgba(5,5,5,0.15)), url(${artwork.coverImageUrl})` }}
            />

            <div className="flex flex-col gap-5 p-6 md:p-8">
              <Link href="/main/explore" className="inline-flex w-fit rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10">
                작품보기로 돌아가기
              </Link>

              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">{artwork.category}</p>
                <h1 className="text-4xl font-black tracking-tight">{artwork.title}</h1>
                <p className="text-sm text-zinc-400">{artwork.authorName} · {artwork.status === 'completed' ? '완결' : '연재중'}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {artwork.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100">
                    #{tag}
                  </span>
                ))}
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
                      : '프로토타입 연동'}
                </span>
              </div>

              <p className="max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">{artwork.summary}</p>

              <div className="flex flex-wrap gap-3">
                <Link href={`/main/explore/${artwork.id}/episodes/${artwork.episodes[0].id}`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
                  첫 화 보기
                </Link>
                <LibraryToggleButton artworkId={artwork.id} artworkTitle={artwork.title} initialSaved={isSaved} />
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
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">장르: {artwork.category}</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">작가: {artwork.authorName}</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">상태: {artwork.status === 'completed' ? '완결' : '연재중'}</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">댓글: {artwork.isCommentEnabled ? '활성화' : '비활성화'}</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                연동 상태: {backendCoverage.hasAnyLink ? `${backendCoverage.linkedCount}/${backendCoverage.totalCount}화 서버 준비` : '아직 목업 단계'}
              </div>
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

            <section id="related" className="scroll-mt-24 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="border-b border-white/10 pb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Related</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">추천작</h2>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {recommended.map((item) => (
                  <ArtworkCard
                    key={item.id}
                    title={item.title}
                    authorName={item.authorName}
                    coverImageUrl={item.coverImageUrl}
                    status={item.status}
                    isAdultOnly={item.isAdultOnly}
                    isCommentEnabled={item.isCommentEnabled}
                    tags={item.tags}
                    href={`/main/explore/${item.id}`}
                  />
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
