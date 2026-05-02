import Link from 'next/link'
import { getCreatorSparkList } from '@/lib/server/spark'
import { getCreatorWebtoonList } from '@/lib/server/webtoon-studio'
import { getSparkFormatLabel, getSparkStatusLabel } from '@/lib/spark'
import { getWebtoonStatusLabel } from '@/lib/webtoon'

const channelModel = [
  'profiles -> channels -> episodes -> episode_images 구조를 유지하면서 work_type으로 웹툰과 스파크를 같은 뼈대 안에서 구분합니다.',
  'warning 카테고리 태그와 is_adult_only 플래그를 함께 사용해 민감도와 접근 제한을 분리합니다.',
  '스파크는 채널 단위 메타데이터로 먼저 공개하고, 이후 필요하면 에피소드/패널 확장으로 이어갈 수 있습니다.',
]

export default async function StudioChannelsPage() {
  const sparkChannels = await getCreatorSparkList()
  const webtoonChannels = await getCreatorWebtoonList()

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Channels</p>
            <h1 className="text-4xl font-black tracking-tight">채널 메뉴</h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-400">
              작품 생성과 수정, 공개 상태 관리, 회차 편집은 이 화면을 중심으로 이어집니다.
            </p>
          </div>

          <Link
            href="/main/studio"
            className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            스튜디오 홈
          </Link>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <ul className="space-y-3 text-sm leading-6 text-zinc-300">
            {channelModel.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Webtoon Studio</p>
              <h2 className="mt-2 text-2xl font-bold text-white">웹툰 채널 관리</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                작품 채널 정보, 공개 상태, 회차 구성, 이미지 업로드까지 이어지는 기본 편집 흐름입니다.
              </p>
            </div>
            <Link
              href="/main/studio/channels/webtoon/new"
              className="inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              새 웹툰 만들기
            </Link>
          </div>

          {webtoonChannels.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {webtoonChannels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/main/studio/channels/webtoon/${channel.id}/edit`}
                  className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/10"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{channel.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {channel.category} · 회차 {channel.episodeCount}개
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {getWebtoonStatusLabel(channel.status)}
                      </span>
                      {channel.tags.slice(0, 3).map((tag) => (
                        <span key={`${channel.id}-${tag}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-sm leading-6 text-zinc-400">
              아직 만든 웹툰 채널이 없습니다. 첫 작품 채널을 만들면 이곳에서 회차와 공개 상태를 계속 관리할 수 있습니다.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-sky-400/20 bg-sky-500/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Spark Studio</p>
              <h2 className="mt-2 text-2xl font-bold text-white">스파크 채널 관리</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                단독 컷과 4컷 만평을 실제 데이터로 만들고 수정할 수 있는 최소 편집 흐름입니다.
              </p>
            </div>
            <Link
              href="/main/studio/channels/spark/new"
              className="inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              새 스파크 만들기
            </Link>
          </div>

          {sparkChannels.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {sparkChannels.map((spark) => (
                <Link
                  key={spark.id}
                  href={`/main/studio/channels/spark/${spark.id}/edit`}
                  className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/10"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{spark.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{spark.caption}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {getSparkFormatLabel(spark.format)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {getSparkStatusLabel(spark.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-sm leading-6 text-zinc-400">
              아직 만든 스파크가 없습니다. 첫 스파크를 만들면 여기에서 공개 상태와 카피를 계속 다듬을 수 있습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
