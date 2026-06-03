import { notFound } from 'next/navigation'
import { updateWebtoonEpisode } from '@/app/main/studio/channels/actions'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { WebtoonEpisodeEditorForm } from '@/components/webtoon/WebtoonEpisodeEditorForm'
import { getCreatorWebtoonById } from '@/lib/server/webtoon-studio'
import { getEpisodeStatusLabel } from '@/lib/webtoon'

export default async function EditWebtoonEpisodePage({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>
}) {
  const { id, episodeId } = await params
  const webtoon = await getCreatorWebtoonById(id)

  if (!webtoon) {
    notFound()
  }

  const episode = webtoon.episodes.find((entry) => entry.id === episodeId)

  if (!episode) {
    notFound()
  }
  const isShortForm = webtoon.workScale === 'short'

  async function updateEpisodeWithIds(formData: FormData) {
    'use server'
    formData.set('channelId', id)
    formData.set('episodeId', episodeId)
    await updateWebtoonEpisode(formData)
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href={`/main/studio/channels/webtoon/${id}/edit`} ariaLabel="툰 편집으로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">My Bottega / Toon / Episode</p>
            <p className="text-sm text-zinc-400">현재 상태: {getEpisodeStatusLabel(episode.status)}</p>
          </div>
        </header>

        <WebtoonEpisodeEditorForm
          action={updateEpisodeWithIds}
          channelId={id}
          episodeId={episodeId}
          initialValue={episode}
          heading={isShortForm ? '단편 원고 수정' : '회차 원고 수정'}
          description={
            isShortForm
              ? '단편 툰의 본편 이미지 순서와 공개 상태를 다듬습니다.'
              : '작품 설정은 유지하고, 이번 회차의 제목과 원고 이미지 순서만 다듬습니다.'
          }
          isShortForm={isShortForm}
          submitLabel={isShortForm ? '단편 원고 저장' : '회차 변경 저장'}
          workTitle={webtoon.title}
        />
      </div>
    </main>
  )
}
