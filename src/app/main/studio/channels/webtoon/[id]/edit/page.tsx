import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateWebtoonChannel } from '@/app/main/studio/channels/actions'
import { WebtoonEditorForm } from '@/components/webtoon/WebtoonEditorForm'
import { getCreatorWebtoonById } from '@/lib/server/webtoon-studio'
import { getEpisodePricingLabel, getEpisodeStatusLabel, getWebtoonStatusLabel } from '@/lib/webtoon'

export default async function EditWebtoonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const webtoon = await getCreatorWebtoonById(id)

  if (!webtoon) {
    notFound()
  }

  async function updateWebtoonChannelWithId(formData: FormData) {
    'use server'
    formData.set('channelId', id)
    await updateWebtoonChannel(formData)
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Webtoon</p>
            <p className="text-sm text-zinc-400">현재 상태: {getWebtoonStatusLabel(webtoon.status)}</p>
          </div>
          <Link
            href="/main/studio/channels"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            채널 메뉴로
          </Link>
        </header>

        <WebtoonEditorForm
          action={updateWebtoonChannelWithId}
          initialValue={webtoon}
          heading="웹툰 채널 수정"
          description="탐색 노출에 쓰이는 작품 메타데이터와 연재 운용 기준을 직접 다듬습니다."
          submitLabel="변경 저장"
          channelId={webtoon.id}
        />

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Episodes</p>
              <h2 className="mt-2 text-2xl font-bold text-white">회차 관리</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                회차별 공개 상태, 가격 정책, 이미지 업로드를 이곳에서 이어서 관리합니다.
              </p>
            </div>
            <Link
              href={`/main/studio/channels/webtoon/${webtoon.id}/episodes/new`}
              className="inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              새 회차 만들기
            </Link>
          </div>

          {webtoon.episodes.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {webtoon.episodes.map((episode) => (
                <Link
                  key={episode.id}
                  href={`/main/studio/channels/webtoon/${webtoon.id}/episodes/${episode.id}/edit`}
                  className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/10"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {episode.episodeNumber}화. {episode.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        이미지 {episode.images.length}장 · {getEpisodePricingLabel(episode.pricingType)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {getEpisodeStatusLabel(episode.status)}
                      </span>
                      {episode.pricingType !== 'free' ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          {episode.coinPrice} 코인
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-sm leading-6 text-zinc-400">
              아직 만든 회차가 없습니다. 첫 회차를 만들면 여기에서 이미지 업로드와 공개 상태를 계속 다듬을 수 있습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
