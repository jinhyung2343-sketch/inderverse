import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { SparkEditorForm } from '@/components/spark/SparkEditorForm'
import { getCreatorSparkById } from '@/lib/server/spark'
import { updateSparkChannel } from '@/app/main/studio/channels/actions'
import { getAgeRatingLabel } from '@/lib/spark'

export default async function EditSparkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const spark = await getCreatorSparkById(id)

  if (!spark) {
    notFound()
  }

  async function updateSparkChannelWithId(formData: FormData) {
    'use server'
    formData.set('channelId', id)
    await updateSparkChannel(formData)
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href="/main/studio/channels" ariaLabel="내 작품으로 돌아가기" />

        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Spark</p>
            <p className="text-sm text-zinc-400">현재 상태: {spark.status === 'publishing' ? '공개 중' : spark.status === 'completed' ? '아카이브' : '초안'}</p>
            <p className="text-sm text-zinc-500">현재 등급: {getAgeRatingLabel(spark.ageRating)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/main/studio/channels/spark/${spark.id}/rating`}
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              등급 설정
            </Link>
          </div>
        </header>

        <SparkEditorForm
          action={updateSparkChannelWithId}
          initialValue={spark}
          heading="스파크 수정"
          description="카드 카피, 주제, 공개 상태를 다듬으면서 스파크를 실제 서비스 흐름 안으로 옮기는 단계입니다."
          submitLabel="변경 저장"
          channelId={spark.id}
        />
      </div>
    </main>
  )
}
