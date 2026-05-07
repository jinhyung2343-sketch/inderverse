import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'
import { SparkFeed } from '@/components/spark/SparkFeed'
import { getPublicSparkList } from '@/lib/server/spark'

export default async function SparkPage() {
  const sparkWorks = await getPublicSparkList()

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
              짧은 컷으로 이슈와 관점을 빠르게 훑어보는 숏폼 만평 피드입니다.
            </p>
          </div>
        </header>

        <SparkFeed sparkWorks={sparkWorks} />
      </div>
    </main>
  )
}
