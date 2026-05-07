import Link from 'next/link'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'
import { sanitizeInternalPath } from '@/lib/guest-policy'

export function JoinPromptPageClient({
  nextPath,
}: {
  nextPath: string | null
}) {
  const safeNextPath = nextPath ? sanitizeInternalPath(nextPath, '/main') : null
  const encodedNextPath = safeNextPath ? encodeURIComponent(safeNextPath) : null
  const signUpHref = encodedNextPath ? `/auth/sign-up?next=${encodedNextPath}` : '/auth/sign-up'

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] px-6 text-white selection:bg-white/30">
      <header className="absolute left-0 top-0 z-20 w-full p-6 md:p-8">
        <PageBackLink href="/" />
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
          <Link
            href={signUpHref}
            className="flex w-full items-center justify-center rounded-xl bg-white py-4 font-semibold tracking-wide text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98]"
          >
            회원가입
          </Link>

          <Link
            href="/main"
            className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-4 font-medium text-zinc-300 transition-colors hover:scale-[1.02] hover:bg-white/10 active:scale-[0.98]"
          >
            아니요 (게스트로 계속)
          </Link>
        </div>
      </div>
    </main>
  )
}
