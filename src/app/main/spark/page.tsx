import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import { SparkFeed } from '@/components/spark/SparkFeed'

export default function SparkPage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Spark</p>
              <h1 className="text-4xl font-black tracking-tight">{BRAND.name} Spark</h1>
              <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                사회, 정치, 인물 이슈를 짧고 재치 있게 비트는 숏폼 만평 공간입니다. 지금 단계에서는 세부 기능보다 카드
                구조와 관리 경계를 먼저 고정해두었습니다.
              </p>
            </div>

            <Link href="/main" className="hidden rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10 md:inline-flex">
              허브로 돌아가기
            </Link>
          </div>
        </header>

        <SparkFeed />

        <Link href="/main" className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10 md:hidden">
          허브로 돌아가기
        </Link>
      </div>
    </main>
  )
}
