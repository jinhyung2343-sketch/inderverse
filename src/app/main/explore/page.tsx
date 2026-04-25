import Link from 'next/link'
import { BRAND } from '@/lib/brand'

const pillars = [
  '작가가 채널 단위로 세계관과 수익 구조를 직접 설계할 수 있습니다.',
  '성인물은 법적 테두리 안에서 연령 게이트와 경고 태그를 통해 유통합니다.',
  '에피소드 결제, 기다리면 무료, 라이브러리 축적이 하나의 흐름으로 이어집니다.',
]

export default function ExplorePage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Explore</p>
          <h1 className="text-4xl font-black tracking-tight">{BRAND.name} 작품 탐색</h1>
          <p className="max-w-2xl text-zinc-400">
            독립 창작 플랫폼이라는 방향성에 맞춰, 탐색 화면도 장르 다양성과 작가 중심 큐레이션을 우선하는 구조로 확장될 예정입니다.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm leading-6 text-zinc-300">{pillar}</p>
            </article>
          ))}
        </section>

        <Link href="/main" className="text-sm text-zinc-400 underline underline-offset-4">
          허브로 돌아가기
        </Link>
      </div>
    </main>
  )
}
