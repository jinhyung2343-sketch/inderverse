import { connection } from 'next/server'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'
import { SparkFeed } from '@/components/spark/SparkFeed'
import { getPublicSparkListPage } from '@/lib/server/spark'
import type { SparkFormat } from '@/lib/spark'

export const revalidate = 120

function getActiveFormat(value: string | string[] | undefined): SparkFormat {
  const format = Array.isArray(value) ? value[0] : value

  return format === 'four_cut' ? 'four_cut' : 'single_cut'
}

function getActivePage(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value)

  return Number.isFinite(page) ? page : 1
}

export default async function SparkPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await connection()
  const resolvedSearchParams = await searchParams
  const activeFormat = getActiveFormat(resolvedSearchParams.format)
  const sparkPage = await getPublicSparkListPage({
    format: activeFormat,
    page: getActivePage(resolvedSearchParams.page),
  })

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#050505] px-5 py-8 text-white selection:bg-white/30 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <PageBackLink href="/main" ariaLabel="허브로 돌아가기" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Spark</p>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">{BRAND.name} Spark</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              짧은 컷으로 이슈와 관점을 빠르게 훑어보는 숏폼 스파크 피드입니다.
            </p>
          </div>
        </header>

        <SparkFeed activeFormat={activeFormat} sparkPage={sparkPage} />
      </div>
    </main>
  )
}
