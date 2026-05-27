import { notFound } from 'next/navigation'
import { updateChannelContentRatingWithState } from '@/app/main/studio/channels/actions'
import { ContentRatingStepForm } from '@/components/content/ContentRatingStepForm'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { ClearLocalDraftOnMount } from '@/components/studio/ClearLocalDraftOnMount'
import { StudioFlowSteps } from '@/components/studio/StudioFlowSteps'
import { getCreatorWebtoonById } from '@/lib/server/webtoon-studio'

export default async function WebtoonRatingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ clearDraftKey?: string }>
}) {
  const { id } = await params
  const { clearDraftKey } = await searchParams
  const webtoon = await getCreatorWebtoonById(id)

  if (!webtoon) {
    notFound()
  }

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

        <StudioFlowSteps
          currentStep={2}
          steps={[
            { label: '작품 정보 저장', description: '제목, 소개, 커버, 장르, 연재 요일' },
            { label: '등급 지정', description: '연령 등급과 수위 체크리스트' },
            { label: '회차 업로드', description: '1화 제목과 원고 이미지' },
          ]}
        />

        <ContentRatingStepForm
          action={updateChannelContentRatingWithState}
          channelId={webtoon.id}
          workType="webtoon"
          title={`${webtoon.title} 등급 설정`}
          ageRating={webtoon.ageRating}
          ratingChecklist={webtoon.ratingChecklist}
          backHref={`/main/studio/channels/webtoon/${webtoon.id}/edit`}
          nextPath={`/main/studio/channels/webtoon/${webtoon.id}/episodes/new`}
          submitLabel="등급 저장하고 회차 업로드하기"
        />
      </div>
    </main>
  )
}
