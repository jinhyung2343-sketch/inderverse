import { notFound } from 'next/navigation'
import { createNovelEpisode } from '@/app/main/studio/channels/actions'
import { NovelEpisodeEditorForm } from '@/components/novel/NovelEpisodeEditorForm'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getCreatorNovelById } from '@/lib/server/novel-studio'

export default async function NewNovelEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const novel = await getCreatorNovelById(id)

  if (!novel) {
    notFound()
  }

  async function createEpisodeForNovel(formData: FormData) {
    'use server'
    formData.set('channelId', id)
    await createNovelEpisode(formData)
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href={`/main/studio/channels/novel/${id}/edit`} ariaLabel="소설 편집으로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">My Bottega / Novel / Episode</p>
            <p className="text-sm text-zinc-400">{novel.title}에 새 회차를 추가합니다.</p>
          </div>
        </header>

        <NovelEpisodeEditorForm
          action={createEpisodeForNovel}
          heading="새 소설 회차 만들기"
          description="회차의 제목, 가격 정책, 공개 상태와 본문을 함께 저장합니다."
          submitLabel="회차 저장"
        />
      </div>
    </main>
  )
}
