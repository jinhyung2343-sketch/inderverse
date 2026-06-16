import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EpisodeAccessPanel } from '@/components/episodes/EpisodeAccessPanel'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getEpisodeById } from '@/lib/explore'
import { getReaderSafeEpisodePayload } from '@/lib/episode-teaser'
import { checkEpisodeDynamicAccess } from '@/lib/server/dynamic-access'
import { getPublicArtworkById } from '@/lib/server/explore'
import { getViewerSession } from '@/lib/server/viewer-session'
import { createClient } from '@/lib/supabase/server'
import { getWorkTypeLabel } from '@/lib/work'

export const revalidate = 60

async function hasViewerPurchasedEpisode(userId: string | null, episodeId: string | undefined) {
  if (!userId || !episodeId) {
    return false
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('episode_id', episodeId)
    .maybeSingle()

  if (error) {
    return false
  }

  return Boolean(data)
}

export default async function EpisodeReaderPage({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>
}) {
  const { id, episodeId } = await params
  const viewer = await getViewerSession()
  const artwork = await getPublicArtworkById(id, {
    includeAdultContent: viewer.isAdultVerified,
    viewerId: viewer.userId,
  })

  if (!artwork) {
    notFound()
  }

  const episode = getEpisodeById(artwork, episodeId)

  if (!episode) {
    notFound()
  }

  const isShortForm = artwork.workScale === 'short'
  const accessDecision = episode.backendEpisodeId && episode.backendChannelId
    ? await checkEpisodeDynamicAccess({
        channelId: episode.backendChannelId,
        episodeId: episode.backendEpisodeId,
      })
    : null
  const hasPurchased = isShortForm && accessDecision?.reason === 'teaser'
    ? await hasViewerPurchasedEpisode(viewer.userId, episode.backendEpisodeId)
    : false
  const hasFullShortFormAccess = isShortForm && accessDecision?.reason === 'teaser' && (viewer.isSubscribed || hasPurchased)
  const accessState = accessDecision
    ? accessDecision.allowed
      ? hasFullShortFormAccess
        ? 'free' as const
        : isShortForm && accessDecision.reason === 'teaser'
          ? 'teaser' as const
          : 'free' as const
      : 'locked' as const
    : episode.accessState
  const readableEpisode = accessDecision
    ? {
        ...getReaderSafeEpisodePayload(episode, accessState, artwork.teaserPercentage ?? 10),
        accessState,
        accessLabel: accessDecision.allowed
          ? hasFullShortFormAccess && viewer.isSubscribed
            ? '구독 공개'
            : hasFullShortFormAccess && hasPurchased
              ? '소장 공개'
              : accessDecision.reason === 'subscriber'
            ? '구독 공개'
            : accessDecision.reason === 'purchased'
              ? '소장 공개'
              : isShortForm && accessDecision.reason === 'teaser'
                ? `${artwork.teaserPercentage ?? 10}% 맛보기`
                : '맛보기 공개'
          : '구독 필요',
      }
    : getReaderSafeEpisodePayload(episode, episode.accessState, artwork.teaserPercentage ?? 10)

  const currentIndex = artwork.episodes.findIndex((item) => item.id === episode.id)
  const previousEpisode = currentIndex > 0 ? artwork.episodes[currentIndex - 1] : null
  const nextEpisode = currentIndex < artwork.episodes.length - 1 ? artwork.episodes[currentIndex + 1] : null
  const backAriaLabel = isShortForm ? '작품 정보로 돌아가기' : '회차 목록으로 돌아가기'
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageBackLink href={`/main/explore/${artwork.id}`} ariaLabel={backAriaLabel} />

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

        <EpisodeAccessPanel
          artworkId={artwork.id}
          episode={readableEpisode}
          isShortForm={isShortForm}
          teaserPercentage={artwork.teaserPercentage ?? 10}
        />

        {isShortForm ? (
          <nav className="flex justify-center rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <Link
              href={`/main/explore/${artwork.id}`}
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              작품 정보로 돌아가기
            </Link>
          </nav>
        ) : (
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
        )}
      </div>
    </main>
  )
}
