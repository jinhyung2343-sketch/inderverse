import { notFound } from 'next/navigation'
import { updateChannelContentRating } from '@/app/main/studio/channels/actions'
import { ContentRatingStepForm } from '@/components/content/ContentRatingStepForm'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getCreatorNovelById } from '@/lib/server/novel-studio'

export default async function NovelRatingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const novel = await getCreatorNovelById(id)

  if (!novel) {
    notFound()
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageBackLink href={`/main/studio/channels/novel/${novel.id}/edit`} ariaLabel="웹소설 편집으로 돌아가기" />

        <ContentRatingStepForm
          action={updateChannelContentRating}
          channelId={novel.id}
          workType="novel"
          title={`${novel.title} 등급 설정`}
          ageRating={novel.ageRating}
          ratingChecklist={novel.ratingChecklist}
          backHref={`/main/studio/channels/novel/${novel.id}/edit`}
          nextPath={`/main/studio/channels/novel/${novel.id}/edit`}
        />
      </div>
    </main>
  )
}
