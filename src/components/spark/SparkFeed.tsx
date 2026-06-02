import Link from 'next/link'
import { SparkCard } from '@/components/spark/SparkCard'
import type { PublicSparkListPage } from '@/lib/server/spark'
import type { SparkFormat } from '@/lib/spark'
import { getSparkFormatLabel } from '@/lib/spark'

const sparkFormatMenus: SparkFormat[] = ['single_cut', 'four_cut']

export function SparkFeed({
  activeFormat,
  sparkPage,
}: {
  activeFormat: SparkFormat
  sparkPage: PublicSparkListPage
}) {
  const activeLabel = getSparkFormatLabel(activeFormat)
  const sparkWorks = sparkPage.sparks

  return (
    <section className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{activeLabel}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            공개된 작품 {sparkPage.totalCount}개 중 {sparkWorks.length}개를 보여줍니다.
          </p>
        </div>
        <nav aria-label="스파크 형식" className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
          {sparkFormatMenus.map((format) => {
            const isActive = format === activeFormat
            const label = getSparkFormatLabel(format)

            return (
              <Link
                key={format}
                href={`/main/spark?format=${format}`}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {sparkWorks.length > 0 ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sparkWorks.map((spark) => (
              <SparkCard key={spark.id} spark={spark} />
            ))}
          </div>
          <SparkFeedPagination activeFormat={activeFormat} sparkPage={sparkPage} />
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.04] px-6 py-12 text-center">
          <p className="text-lg font-semibold text-white">공개된 {activeLabel} 작품이 아직 없습니다.</p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            첫 작품이 올라오면 이 메뉴 안에 제목 또는 무제로 나열됩니다.
          </p>
        </div>
      )}
    </section>
  )
}

function getSparkFeedHref(format: SparkFormat, page: number) {
  const params = new URLSearchParams({ format })

  if (page > 1) {
    params.set('page', String(page))
  }

  return `/main/spark?${params.toString()}`
}

function SparkFeedPagination({
  activeFormat,
  sparkPage,
}: {
  activeFormat: SparkFormat
  sparkPage: PublicSparkListPage
}) {
  if (sparkPage.totalPages <= 1) {
    return null
  }

  const previousHref = getSparkFeedHref(activeFormat, sparkPage.page - 1)
  const nextHref = getSparkFeedHref(activeFormat, sparkPage.page + 1)

  return (
    <nav aria-label="스파크 작품 페이지" className="flex items-center justify-between gap-3 border-t border-white/10 pt-5">
      {sparkPage.hasPreviousPage ? (
        <Link
          href={previousHref}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          이전
        </Link>
      ) : (
        <span className="rounded-full border border-white/5 px-5 py-3 text-sm text-zinc-600">이전</span>
      )}

      <p className="text-sm text-zinc-400">
        {sparkPage.page} / {sparkPage.totalPages}
      </p>

      {sparkPage.hasNextPage ? (
        <Link
          href={nextHref}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          다음
        </Link>
      ) : (
        <span className="rounded-full border border-white/5 px-5 py-3 text-sm text-zinc-600">다음</span>
      )}
    </nav>
  )
}
