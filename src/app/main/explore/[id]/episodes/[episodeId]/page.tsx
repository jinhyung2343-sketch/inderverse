import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EpisodeAccessPanel } from '@/components/episodes/EpisodeAccessPanel'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getEpisodeById } from '@/lib/explore'
import { checkEpisodeDynamicAccess } from '@/lib/server/dynamic-access'
import { getPublicArtworkById } from '@/lib/server/explore'
import { getWorkTypeLabel } from '@/lib/work'

export const revalidate = 60

export default async function EpisodeReaderPage({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>
}) {
  const { id, episodeId } = await params
  const artwork = await getPublicArtworkById(id)

  if (!artwork) {
    notFound()
  }

  const episode = getEpisodeById(artwork, episodeId)

  if (!episode) {
    notFound()
  }

  const accessDecision = episode.backendEpisodeId && episode.backendChannelId
    ? await checkEpisodeDynamicAccess({
        channelId: episode.backendChannelId,
        episodeId: episode.backendEpisodeId,
      })
    : null
  const readableEpisode = accessDecision
    ? {
        ...episode,
        accessState: accessDecision.allowed ? 'free' as const : 'locked' as const,
        accessLabel: accessDecision.allowed
          ? accessDecision.reason === 'subscriber'
            ? '구독 공개'
            : accessDecision.reason === 'purchased'
              ? '소장 공개'
            : '맛보기 공개'
          : '구독 필요',
      }
    : episode

  const currentIndex = artwork.episodes.findIndex((item) => item.id === episode.id)
  const previousEpisode = currentIndex > 0 ? artwork.episodes[currentIndex - 1] : null
  const nextEpisode = currentIndex < artwork.episodes.length - 1 ? artwork.episodes[currentIndex + 1] : null
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageBackLink href={`/main/explore/${artwork.id}`} ariaLabel="회차 목록으로 돌아가기" />

        <header className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <Link href="/main/explore" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 transition hover:bg-white/10">
              작품보기
            </Link>
            <Link href={`/main/explore/${artwork.id}`} className="rounded-full border border-white/10 bg-black/20 px-4 py-2 transition hover:bg-white/10">
              {artwork.title}
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
              {artwork.workType ? getWorkTypeLabel(artwork.workType) : '작품'} · {artwork.category} ·{' '}
              {artwork.creatorSlug ? (
                <Link href={`/main/creators/${artwork.creatorSlug}`} className="transition hover:text-white">
                  {artwork.authorName}
                </Link>
              ) : (
                artwork.authorName
              )}
            </p>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{episode.title}</h1>
            <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{episode.preview}</p>
          </div>
        </header>

        <EpisodeAccessPanel artworkId={artwork.id} episode={readableEpisode} />

        <nav className="grid gap-3 rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:grid-cols-3">
          <div className="flex items-center">
            {previousEpisode ? (
              <Link
                href={`/main/explore/${artwork.id}/episodes/${previousEpisode.id}`}
                className="inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                이전 화
              </Link>
            ) : (
              <span className="text-sm text-zinc-600">첫 화입니다</span>
            )}
          </div>

          <div className="flex items-center justify-center">
            <Link
              href={`/main/explore/${artwork.id}`}
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              회차 목록
            </Link>
          </div>

          <div className="flex items-center justify-end">
            {nextEpisode ? (
              <Link
                href={`/main/explore/${artwork.id}/episodes/${nextEpisode.id}`}
                className="inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                다음 화
              </Link>
            ) : (
              <span className="text-sm text-zinc-600">마지막 화입니다</span>
            )}
          </div>
        </nav>
      </div>
    </main>
  )
}
