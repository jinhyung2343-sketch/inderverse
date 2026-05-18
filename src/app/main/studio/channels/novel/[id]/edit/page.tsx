import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateNovelChannel } from '@/app/main/studio/channels/actions'
import { NovelEditorForm } from '@/components/novel/NovelEditorForm'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getCreatorNovelById } from '@/lib/server/novel-studio'
import {
  getAgeRatingLabel,
  getNovelEpisodeStatusLabel,
  getNovelStatusLabel,
} from '@/lib/novel'

export default async function EditNovelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const novel = await getCreatorNovelById(id)

  if (!novel) {
    notFound()
  }

  async function updateNovelChannelWithId(formData: FormData) {
    'use server'
    formData.set('channelId', id)
    await updateNovelChannel(formData)
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href="/main/studio/channels" ariaLabel="내 작품으로 돌아가기" />

        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Novel</p>
            <p className="text-sm text-zinc-400">현재 상태: {getNovelStatusLabel(novel.status)}</p>
            <p className="text-sm text-zinc-500">현재 등급: {getAgeRatingLabel(novel.ageRating)}</p>
          </div>
          <Link
            href={`/main/studio/channels/novel/${novel.id}/rating`}
            className="inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            등급 설정
          </Link>
        </header>

        <NovelEditorForm
          action={updateNovelChannelWithId}
          initialValue={novel}
          heading="웹소설 수정"
          description="작품 메타데이터와 공개 설정을 다듬고, 아래 회차 섹션에서 본문을 이어서 관리합니다."
          submitLabel="변경 저장"
          channelId={novel.id}
        />

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Novel Episodes</p>
              <h2 className="mt-2 text-2xl font-bold text-white">회차 관리</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                회차별 본문, 공개 상태, 가격 정책을 이곳에서 이어서 관리합니다.
              </p>
            </div>
            <Link
              href={`/main/studio/channels/novel/${novel.id}/episodes/new`}
              className="inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              새 회차 만들기
            </Link>
          </div>

          {novel.episodes.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {novel.episodes.map((episode) => (
                <Link
                  key={episode.id}
                  href={`/main/studio/channels/novel/${novel.id}/episodes/${episode.id}/edit`}
                  className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/10"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {episode.episodeNumber}화. {episode.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        본문 {episode.bodyText.replace(/\s/g, '').length.toLocaleString('ko-KR')}자
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {getNovelEpisodeStatusLabel(episode.status)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        맛보기/구독 규칙 적용
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-sm leading-6 text-zinc-400">
              아직 만든 회차가 없습니다. 첫 회차를 만들면 여기에서 본문과 공개 상태를 계속 다듬을 수 있습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
