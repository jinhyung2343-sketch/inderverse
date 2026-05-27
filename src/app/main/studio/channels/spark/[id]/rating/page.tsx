import { notFound } from 'next/navigation'
import { updateChannelContentRatingWithState } from '@/app/main/studio/channels/actions'
import { ContentRatingStepForm } from '@/components/content/ContentRatingStepForm'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getCreatorSparkById } from '@/lib/server/spark'

export default async function SparkRatingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const spark = await getCreatorSparkById(id)

  if (!spark) {
    notFound()
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageBackLink href={`/main/studio/channels/spark/${spark.id}/edit`} ariaLabel="스파크 편집으로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">My Bottega / Toon / Spark / Rating</p>
            <p className="text-sm text-zinc-400">스파크 전체 등급과 성인 인증 노출 기준을 먼저 고정합니다.</p>
          </div>
        </header>

        <ContentRatingStepForm
          action={updateChannelContentRatingWithState}
          channelId={spark.id}
          workType="spark"
          title={`${spark.title} 등급 설정`}
          ageRating={spark.ageRating}
          ratingChecklist={spark.ratingChecklist}
          backHref={`/main/studio/channels/spark/${spark.id}/edit`}
          nextPath={`/main/studio/channels/spark/${spark.id}/edit`}
        />
      </div>
    </main>
  )
}
