'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/brand'

export function JoinPromptPageClient({
  nextPath,
}: {
  nextPath: string | null
}) {
  const router = useRouter()
  const encodedNextPath = nextPath ? encodeURIComponent(nextPath) : null

  const handleSignUp = () => {
    router.push(encodedNextPath ? `/auth/sign-up?next=${encodedNextPath}` : '/auth/sign-up')
  }

  const handleGuest = () => {
    router.push('/main')
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] px-6 text-white selection:bg-white/30">
      <header className="absolute left-0 top-0 z-20 w-full p-6 md:p-8">
        <Link
          href="/"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10"
          aria-label="뒤로 가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
      </header>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-white/5 blur-[100px]"></div>
      </div>

      <div className="z-10 flex w-full max-w-md animate-fade-in flex-col items-center gap-8 text-center">
        <div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {BRAND.name}에 오신 것을 환영합니다
          </h1>
          <p className="text-sm font-light leading-relaxed text-zinc-400 md:text-base">
            거대 플랫폼의 규칙이 아니라 작가와 독자가 직접 흐름을 만드는 공간입니다.
            <br />
            가입 후 작품 탐색, 후원, 라이브러리 기능을 이어서 사용할 수 있어요.
          </p>
        </div>

        <div className="mt-4 flex w-full flex-col gap-4">
          <button
            onClick={handleSignUp}
            className="w-full rounded-xl bg-white py-4 font-semibold tracking-wide text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98]"
          >
            회원가입
          </button>

          <button
            onClick={handleGuest}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-4 font-medium text-zinc-300 transition-colors hover:scale-[1.02] hover:bg-white/10 active:scale-[0.98]"
          >
            아니요 (게스트로 계속)
          </button>
        </div>
      </div>
    </main>
  )
}
