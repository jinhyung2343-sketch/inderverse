import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { ArtworkCard } from '@/components/ui/ArtworkCard'
import { getPublicCreatorChannelPage } from '@/lib/server/public-creator-channels'
import { getViewerSession } from '@/lib/server/viewer-session'
import { getWorkTypeLabel } from '@/lib/work'

export const revalidate = 60

export default async function PublicCreatorChannelPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const viewer = await getViewerSession()
  const page = await getPublicCreatorChannelPage(slug, {
    includeAdultContent: viewer.isAdultVerified,
    viewerId: viewer.userId,
  })

  if (!page) {
    notFound()
  }

  const { channel, artworks } = page
  const webtoonWorks = artworks.filter((artwork) => artwork.workType === 'webtoon')
  const novelWorks = artworks.filter((artwork) => artwork.workType === 'novel')
  const latestArtwork = artworks[0] ?? null

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <PageBackLink href="/main/explore" ariaLabel="작품보기로 돌아가기" showLabel />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Creator Channel</p>
          </div>

          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.055]">
            <div
              className="h-44 bg-zinc-900 bg-cover bg-center md:h-64"
              style={
                channel.coverImageUrl
                  ? { backgroundImage: `linear-gradient(to top, rgba(5,5,5,0.78), rgba(5,5,5,0.12)), url(${channel.coverImageUrl})` }
                  : undefined
              }
            />
            <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-end md:p-8">
              <div className="-mt-20 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-zinc-900 text-4xl font-black text-zinc-500">
                {channel.avatarUrl ? (
                  <Image
                    src={channel.avatarUrl}
                    alt={channel.displayName}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  channel.displayName.slice(0, 1)
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-500">@{channel.slug}</p>
                  <h1 className="mt-1 text-4xl font-black tracking-tight md:text-5xl">{channel.displayName}</h1>
                </div>
                <p className="max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
                  {channel.bio || '작가 소개가 아직 준비 중입니다.'}
                </p>
                {channel.externalLinks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {channel.externalLinks.map((link) => (
                      <a
                        key={`${link.label}-${link.url}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-zinc-300 transition hover:bg-white/10"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center md:w-64">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xl font-black">{artworks.length}</p>
                  <p className="mt-1 text-xs text-zinc-500">전체</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xl font-black">{webtoonWorks.length}</p>
                  <p className="mt-1 text-xs text-zinc-500">웹툰</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xl font-black">{novelWorks.length}</p>
                  <p className="mt-1 text-xs text-zinc-500">웹소설</p>
                </div>
              </div>
            </div>
          </section>
        </header>

        {latestArtwork ? (
          <section className="grid gap-4 rounded-[32px] border border-white/10 bg-white/[0.055] p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Latest Work</p>
              <h2 className="mt-2 text-2xl font-bold">{latestArtwork.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{latestArtwork.summary}</p>
            </div>
            <Link
              href={`/main/explore/${latestArtwork.id}`}
              className="inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              최신 작품 보기
            </Link>
          </section>
        ) : null}

        <section className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Works</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">공개 작품</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">전체 {artworks.length}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">웹툰 {webtoonWorks.length}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">웹소설 {novelWorks.length}</span>
            </div>
          </div>

          {artworks.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {artworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  title={artwork.title}
                  authorName={artwork.authorName}
                  coverImageUrl={artwork.coverImageUrl}
                  workType={artwork.workType}
                  status={artwork.status}
                  isAdultOnly={artwork.isAdultOnly}
                  isCommentEnabled={artwork.isCommentEnabled}
                  tags={artwork.tags}
                  href={`/main/explore/${artwork.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.04] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-white">아직 공개된 작품이 없습니다.</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                작가가 작품을 공개하면 이 채널에 형식별로 모입니다.
              </p>
            </div>
          )}
        </section>

        <section className="border-t border-white/10 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Types</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(['webtoon', 'novel'] as const).map((workType) => {
              const count = workType === 'webtoon' ? webtoonWorks.length : novelWorks.length

              return (
                <div key={workType} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-xl font-bold">{getWorkTypeLabel(workType)}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{count}개 공개 중</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
