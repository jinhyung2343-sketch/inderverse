import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { SparkCard } from '@/components/spark/SparkCard'
import { SparkEngagementPanel } from '@/components/spark/SparkEngagementPanel'
import { getPublicSparkDetailContext } from '@/lib/server/spark'
import { getSparkAccentClassName, getSparkFormatLabel } from '@/lib/spark'

function formatDate(value: string) {
  const date = new Date(value)

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export default async function SparkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const context = await getPublicSparkDetailContext(id)

  if (!context) {
    notFound()
  }

  const { spark, previousSpark, nextSpark, relatedSparks, engagement } = context

  const accentClassName = getSparkAccentClassName(spark)

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageBackLink href="/main/spark" ariaLabel="스파크로 돌아가기" />

        <header className="space-y-4 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <span>{spark.creatorName}</span>
              <span>·</span>
              <span>{formatDate(spark.updatedAt)}</span>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-300">
              {getSparkFormatLabel(spark.format)}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">{spark.topic}</p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">{spark.title}</h1>
            <p className="max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">{spark.caption}</p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl">
            {spark.panels.length > 0 ? (
              <div
                className={`grid gap-3 p-4 md:p-6 ${
                  spark.format === 'four_cut' ? 'md:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {spark.panels.map((panel, index) => (
                  <figure
                    key={`${spark.id}-panel-${index}`}
                    className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={panel.imageUrl}
                      alt={`${spark.title} ${index + 1}번 컷`}
                      className={`w-full object-cover ${spark.format === 'four_cut' ? 'h-64' : 'h-[420px]'}`}
                    />
                    {panel.caption ? (
                      <figcaption className="border-t border-white/10 px-4 py-3 text-sm leading-6 text-zinc-300">
                        {panel.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : spark.coverImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={spark.coverImageUrl} alt={spark.title} className="h-[360px] w-full object-cover" />
            ) : (
              <div className={`flex h-[360px] items-end bg-gradient-to-br ${accentClassName} p-6`}>
                <div className="rounded-[24px] border border-white/10 bg-black/30 p-5 backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">{spark.topic}</p>
                  <h2 className="mt-3 text-3xl font-black text-white">{spark.title}</h2>
                </div>
              </div>
            )}

            <div className="space-y-5 p-6 md:p-8">
              <p className="text-lg leading-8 text-zinc-100">{spark.description}</p>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Punchline</p>
                <p className="mt-3 text-xl font-semibold leading-8 text-white">“{spark.punchline}”</p>
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <SparkEngagementPanel
              sparkId={spark.id}
              sparkTitle={spark.title}
              initialState={{
                viewCount: engagement.viewCount,
                applauseCount: engagement.applauseCount,
                saved: engagement.viewerHasSaved,
                saveCount: engagement.saveCount,
                canSave: engagement.viewerCanSave,
              }}
            />

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Spark Notes</p>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">컷 수: {spark.panelCount}컷</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">등록된 패널: {spark.panels.length}개</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">톤: {spark.tone ?? '미지정'}</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  성인 구분: {spark.isAdultOnly ? '성인 인증 필요' : '전체 공개'}
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Tags</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {spark.tags.length > 0 ? (
                  spark.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-300">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">아직 태그가 없습니다.</p>
                )}
              </div>
            </section>

            {spark.externalUrl ? (
              <a
                href={spark.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                관련 링크 열기
              </a>
            ) : null}
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {previousSpark ? (
            <Link
              href={`/main/spark/${previousSpark.id}`}
              className="rounded-[32px] border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Previous Spark</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">{previousSpark.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{previousSpark.caption}</p>
            </Link>
          ) : (
            <div className="rounded-[32px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-zinc-500">
              이 스파크보다 앞선 공개 작품이 아직 없습니다.
            </div>
          )}

          {nextSpark ? (
            <Link
              href={`/main/spark/${nextSpark.id}`}
              className="rounded-[32px] border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Next Spark</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">{nextSpark.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{nextSpark.caption}</p>
            </Link>
          ) : (
            <div className="rounded-[32px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-zinc-500">
              이 스파크보다 뒤의 공개 작품이 아직 없습니다.
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Related Sparks</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">이 스파크와 결이 맞는 다른 작품</h2>
            </div>
            <p className="text-sm text-zinc-400">같은 주제, 같은 태그, 비슷한 포맷을 기준으로 묶었습니다.</p>
          </div>

          {relatedSparks.length > 0 ? (
            <div className="mt-6 grid gap-5 xl:grid-cols-3">
              {relatedSparks.map((relatedSpark) => (
                <SparkCard key={relatedSpark.id} spark={relatedSpark} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-sm leading-6 text-zinc-500">
              아직 연관 추천을 만들 만큼 공개된 스파크가 충분하지 않습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
