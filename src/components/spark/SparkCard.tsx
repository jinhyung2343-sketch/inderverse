import Link from 'next/link'
import Image from 'next/image'
import type { SparkRecord } from '@/lib/spark'
import { getSparkAccentClassName, getSparkDisplayTitle, getSparkFormatLabel, getSparkStatusLabel } from '@/lib/spark'

export function SparkCard({ spark }: { spark: SparkRecord }) {
  const formatLabel = getSparkFormatLabel(spark.format)
  const displayTitle = getSparkDisplayTitle(spark.title)
  const accentClassName = getSparkAccentClassName(spark)

  return (
    <Link href={`/main/spark/${spark.id}`} className="block" aria-label={`${displayTitle} 보기`}>
      <article className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] transition hover:border-white/20 hover:bg-white/[0.09]">
        <div className={`grid aspect-[16/10] gap-1 overflow-hidden bg-zinc-950 p-1 ${spark.format === 'four_cut' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {spark.panels.length > 0 ? (
            spark.panels.slice(0, spark.format === 'four_cut' ? 4 : 1).map((panel, index) => (
              <div key={`${spark.id}-card-panel-${index}`} className="relative overflow-hidden rounded-xl bg-zinc-900">
                <Image
                  src={panel.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            ))
          ) : spark.coverImageUrl ? (
            <div className="relative col-span-full overflow-hidden rounded-xl bg-zinc-900">
              <Image
                src={spark.coverImageUrl}
                alt=""
                fill
                sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className={`col-span-full flex h-full items-center justify-center bg-gradient-to-br ${accentClassName} p-5 text-sm text-zinc-300`}>
              컷 준비 중
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
            <p className="line-clamp-1">by {spark.creatorName}</p>
            <span className="shrink-0">{getSparkStatusLabel(spark.status)}</span>
          </div>
          <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-white">{displayTitle}</h3>
          <p className="text-sm font-semibold text-zinc-200">{formatLabel}</p>
        </div>
      </article>
    </Link>
  )
}
