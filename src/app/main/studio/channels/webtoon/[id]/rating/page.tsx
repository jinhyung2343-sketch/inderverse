import { notFound } from 'next/navigation'
import { updateChannelContentRating } from '@/app/main/studio/channels/actions'
import { ContentRatingStepForm } from '@/components/content/ContentRatingStepForm'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getCreatorWebtoonById } from '@/lib/server/webtoon-studio'

export default async function WebtoonRatingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const webtoon = await getCreatorWebtoonById(id)

  if (!webtoon) {
    notFound()
  }

  async function updateRatingForChannel(formData: FormData) {
    'use server'
    await updateChannelContentRating(formData)
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageBackLink href={`/main/studio/channels/webtoon/${webtoon.id}/edit`} ariaLabel="채널 편집으로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Webtoon / Rating</p>
            <p className="text-sm text-zinc-400">작품 전체 등급과 성인 인증 노출 기준을 먼저 고정합니다.</p>
          </div>
        </header>

        <ContentRatingStepForm
          action={updateRatingForChannel}
          channelId={webtoon.id}
          workType="webtoon"
          title={`${webtoon.title} 등급 설정`}
          ageRating={webtoon.ageRating}
          ratingChecklist={webtoon.ratingChecklist}
          backHref={`/main/studio/channels/webtoon/${webtoon.id}/edit`}
          nextPath={`/main/studio/channels/webtoon/${webtoon.id}/edit`}
        />
      </div>
    </main>
  )
}
