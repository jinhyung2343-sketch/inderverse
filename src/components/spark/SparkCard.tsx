import type { SparkWork } from '@/lib/mock/spark-data'

export function SparkCard({ spark }: { spark: SparkWork }) {
  const formatLabel = spark.format === 'single_cut' ? '단독 컷' : '4컷 스트립'

  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/7">
      <div className={`h-44 bg-gradient-to-br ${spark.accentClassName} p-5`}>
        <div className="flex h-full flex-col justify-between rounded-[22px] border border-white/10 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-zinc-200">
              {spark.topic}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">
              {formatLabel}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">{spark.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{spark.caption}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Spark by {spark.creatorName}</p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">{spark.summary}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm leading-6 text-zinc-200">“{spark.punchline}”</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {spark.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}
