import { notFound } from 'next/navigation'
import { updateNovelEpisode } from '@/app/main/studio/channels/actions'
import { NovelEpisodeEditorForm } from '@/components/novel/NovelEpisodeEditorForm'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getCreatorNovelById } from '@/lib/server/novel-studio'
import { getNovelEpisodeStatusLabel } from '@/lib/novel'

export default async function EditNovelEpisodePage({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>
}) {
  const { id, episodeId } = await params
  const novel = await getCreatorNovelById(id)

  if (!novel) {
    notFound()
  }

  const episode = novel.episodes.find((entry) => entry.id === episodeId)

  if (!episode) {
    notFound()
  }

  async function updateEpisodeWithIds(formData: FormData) {
    'use server'
    formData.set('channelId', id)
    formData.set('episodeId', episodeId)
    await updateNovelEpisode(formData)
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href={`/main/studio/channels/novel/${id}/edit`} ariaLabel="소설 편집으로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">My Bottega / Novel / Episode</p>
            <p className="text-sm text-zinc-400">현재 상태: {getNovelEpisodeStatusLabel(episode.status)}</p>
          </div>
        </header>

        <NovelEpisodeEditorForm
          action={updateEpisodeWithIds}
          initialValue={episode}
          heading="소설 회차 수정"
          description="공개용 본문과 가격 정책을 함께 다듬는 단계입니다."
          submitLabel="회차 변경 저장"
        />
      </div>
    </main>
  )
}
