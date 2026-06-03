import { notFound } from 'next/navigation'
import { updateChannelContentRatingWithState } from '@/app/main/studio/channels/actions'
import { ContentRatingStepForm } from '@/components/content/ContentRatingStepForm'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { ClearLocalDraftOnMount } from '@/components/studio/ClearLocalDraftOnMount'
import { getCreatorWebtoonById } from '@/lib/server/webtoon-studio'

export default async function WebtoonRatingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ clearDraftKey?: string; flow?: string }>
}) {
  const { id } = await params
  const { clearDraftKey, flow } = await searchParams
  const webtoon = await getCreatorWebtoonById(id)

  if (!webtoon) {
    notFound()
  }
  const isShortFlow = webtoon.workScale === 'short' || flow === 'short'
  const nextPath = isShortFlow
    ? `/main/studio/channels/webtoon/${webtoon.id}/episodes/new?flow=short`
    : `/main/studio/channels/webtoon/${webtoon.id}/episodes/new`

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <ClearLocalDraftOnMount storageKey={clearDraftKey} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageBackLink href={`/main/studio/channels/webtoon/${webtoon.id}/edit`} ariaLabel="툰 편집으로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">My Bottega / Toon / Rating</p>
            <p className="text-sm text-zinc-400">작품 전체 등급과 성인 인증 노출 기준을 먼저 고정합니다.</p>
          </div>
        </header>

        <ContentRatingStepForm
          action={updateChannelContentRatingWithState}
          channelId={webtoon.id}
          workType="webtoon"
          title={`${webtoon.title} 등급 설정`}
          ageRating={webtoon.ageRating}
          ratingChecklist={webtoon.ratingChecklist}
          backHref={`/main/studio/channels/webtoon/${webtoon.id}/edit`}
          nextPath={nextPath}
          workScale={isShortFlow ? 'short' : undefined}
          submitLabel={isShortFlow ? '등급 저장하고 단편 원고 업로드하기' : '등급 저장하고 회차 업로드하기'}
        />
      </div>
    </main>
  )
}
