import { notFound } from 'next/navigation'
import { createWebtoonEpisode } from '@/app/main/studio/channels/actions'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { WebtoonEpisodeEditorForm } from '@/components/webtoon/WebtoonEpisodeEditorForm'
import { getCreatorWebtoonById } from '@/lib/server/webtoon-studio'

export default async function NewWebtoonEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const webtoon = await getCreatorWebtoonById(id)

  if (!webtoon) {
    notFound()
  }

  async function createEpisodeForChannel(formData: FormData) {
    'use server'
    formData.set('channelId', id)
    await createWebtoonEpisode(formData)
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href={`/main/studio/channels/webtoon/${id}/rating`} ariaLabel="등급 설정으로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">My Bottega / Toon / Episode</p>
            <p className="text-sm text-zinc-400">{webtoon.title}에 새 회차를 추가합니다.</p>
          </div>
        </header>

        <WebtoonEpisodeEditorForm
          action={createEpisodeForChannel}
          channelId={id}
          heading="새 회차 업로드"
          description="작품 설정은 이미 정해졌습니다. 이제 이번 회차의 제목과 원고 이미지를 순서대로 올려 주세요."
          submitLabel="회차 저장"
          workTitle={webtoon.title}
        />
      </div>
    </main>
  )
}
