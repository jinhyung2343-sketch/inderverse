import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createWebtoonEpisode } from '@/app/main/studio/channels/actions'
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
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Webtoon / Episode</p>
            <p className="text-sm text-zinc-400">{webtoon.title}에 새 회차를 추가합니다.</p>
          </div>
          <Link
            href={`/main/studio/channels/webtoon/${id}/edit`}
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            채널 편집으로
          </Link>
        </header>

        <WebtoonEpisodeEditorForm
          action={createEpisodeForChannel}
          channelId={id}
          heading="새 회차 만들기"
          description="회차의 공개 상태와 가격 정책을 먼저 정하고, 저장 후 수정 화면에서 GCS 업로드까지 이어서 붙이면 됩니다."
          submitLabel="회차 저장"
        />
      </div>
    </main>
  )
}
