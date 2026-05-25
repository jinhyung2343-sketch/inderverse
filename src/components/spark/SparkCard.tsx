import Link from 'next/link'
import Image from 'next/image'
import type { SparkRecord } from '@/lib/spark'
import { getSparkAccentClassName, getSparkFormatLabel, getSparkStatusLabel } from '@/lib/spark'

export function SparkCard({ spark }: { spark: SparkRecord }) {
  const formatLabel = getSparkFormatLabel(spark.format)
  const accentClassName = getSparkAccentClassName(spark)

  return (
    <Link href={`/main/spark/${spark.id}`} className="block">
      <article className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] transition hover:border-white/20 hover:bg-white/[0.09]">
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
          {spark.coverImageUrl ? (
            <Image
              src={spark.coverImageUrl}
              alt={spark.title}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`flex h-full flex-col justify-end bg-gradient-to-br ${accentClassName} p-5`}>
              <h2 className="line-clamp-2 text-2xl font-black tracking-tight text-white">{spark.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">{spark.caption}</p>
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs text-zinc-100 backdrop-blur">
              {spark.topic}
            </span>
            <span className="rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs text-zinc-100 backdrop-blur">
              {formatLabel}
            </span>
          </div>
        </div>

        <div className="flex min-h-64 flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
            <p className="line-clamp-1">by {spark.creatorName}</p>
            <span className="shrink-0">{getSparkStatusLabel(spark.status)}</span>
          </div>

          <div className="space-y-2">
            <h3 className="line-clamp-2 text-xl font-bold tracking-tight text-white">{spark.title}</h3>
            <p className="line-clamp-3 text-sm leading-6 text-zinc-300">{spark.summary}</p>
          </div>

          <p className="line-clamp-2 border-l border-white/15 pl-3 text-sm leading-6 text-zinc-200">
            {spark.punchline}
          </p>

          <div className="mt-auto flex flex-wrap gap-2">
            {spark.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  )
}
