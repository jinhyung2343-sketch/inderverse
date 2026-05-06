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

  async function updateEpisodeWithIds(formData: FormData) {
    'use server'
    formData.set('channelId', id)
    formData.set('episodeId', episodeId)
    await updateWebtoonEpisode(formData)
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href={`/main/studio/channels/webtoon/${id}/edit`} ariaLabel="채널 편집으로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Webtoon / Episode</p>
            <p className="text-sm text-zinc-400">현재 상태: {getEpisodeStatusLabel(episode.status)}</p>
          </div>
        </header>

        <WebtoonEpisodeEditorForm
          action={updateEpisodeWithIds}
          channelId={id}
          episodeId={episodeId}
          initialValue={episode}
          heading="회차 수정"
          description="실제 공개 회차에 필요한 이미지 자산과 가격 정책을 함께 다듬는 단계입니다."
          submitLabel="회차 변경 저장"
        />
      </div>
    </main>
  )
}
