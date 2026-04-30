import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicSparkById } from '@/lib/server/spark'
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
  const spark = await getPublicSparkById(id)

  if (!spark) {
    notFound()
  }

  const accentClassName = getSparkAccentClassName(spark)

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-4 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <Link href="/main/spark" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 transition hover:bg-white/10">
                스파크로 돌아가기
              </Link>
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
            {spark.coverImageUrl ? (
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
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Spark Notes</p>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">컷 수: {spark.panelCount}컷</div>
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
      </div>
    </main>
  )
}
