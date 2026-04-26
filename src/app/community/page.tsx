import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export default function CommunityPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-cyan-500/10 blur-[100px]"></div>
      </div>

      <header className="z-20 flex items-center justify-between">
        <Link
          href="/main"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10"
          aria-label="뒤로 가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">Community</span>
      </header>

      <div className="z-10 mx-auto flex w-full max-w-3xl flex-1 items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl md:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">{BRAND.name}</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">커뮤니티 준비 중</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-400 md:text-base">
            창작자와 독자가 더 깊게 연결될 수 있는 커뮤니티 공간을 준비하고 있습니다.
          </p>
        </section>
      </div>
    </main>
  )
}
