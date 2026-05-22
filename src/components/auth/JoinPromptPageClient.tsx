'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'
import { sanitizeInternalPath } from '@/lib/guest-policy'
import { useAuthStore } from '@/stores/auth'

type JoinPromptInitialAuth = {
  isLoggedIn: boolean
  userNickname: string
} | null

export function JoinPromptPageClient({
  initialAuth,
  nextPath,
}: {
  initialAuth: JoinPromptInitialAuth
  nextPath: string | null
}) {
  const router = useRouter()
  const { refreshStoredAccounts, storedAccounts, switchAccount } = useAuthStore()
  const [isRestoringAccount, setIsRestoringAccount] = useState(false)
  const [restoreError, setRestoreError] = useState('')
  const safeNextPath = nextPath ? sanitizeInternalPath(nextPath, '/main') : null
  const continueHref = safeNextPath ?? '/main'
  const encodedNextPath = safeNextPath ? encodeURIComponent(safeNextPath) : null
  const signUpHref = encodedNextPath ? `/auth/sign-up?next=${encodedNextPath}` : '/auth/sign-up'
  const signInHref = encodedNextPath ? `/auth/sign-in?next=${encodedNextPath}` : '/auth/sign-in'
  const backHref = '/'
  const backLabel = '처음으로 돌아가기'
  const storedAccount = useMemo(() => storedAccounts[0] ?? null, [storedAccounts])

  useEffect(() => {
    refreshStoredAccounts()
  }, [refreshStoredAccounts])

  const handleStoredAccountContinue = async () => {
    if (!storedAccount || isRestoringAccount) {
      return
    }

    setIsRestoringAccount(true)
    setRestoreError('')

    try {
      await switchAccount(storedAccount.userId)
      router.push(continueHref)
      router.refresh()
    } catch (error) {
      setRestoreError(
        error instanceof Error ? error.message : '저장된 계정으로 이어가지 못했습니다. 다시 로그인해 주세요.'
      )
    } finally {
      setIsRestoringAccount(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] px-6 text-white selection:bg-white/30">
      <header className="absolute left-0 top-0 z-20 w-full p-6 md:p-8">
        <div className="flex items-center gap-3">
          <PageBackLink href={backHref} ariaLabel={backLabel} showLabel />
        </div>
      </header>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-white/5 blur-[100px]"></div>
      </div>

      <div className="z-10 flex w-full max-w-md animate-fade-in flex-col items-center gap-8 text-center">
        <div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {initialAuth?.isLoggedIn ? '다시 이어서 볼까요?' : `${BRAND.name}에 오신 것을 환영합니다`}
          </h1>
          <p className="text-sm font-light leading-relaxed text-zinc-400 md:text-base">
            {initialAuth?.isLoggedIn
              ? `${initialAuth.userNickname} 계정으로 바로 이어갈 수 있습니다.`
              : '거대 플랫폼의 규칙이 아니라 작가와 독자가 직접 흐름을 만드는 공간입니다.'}
            {!initialAuth?.isLoggedIn ? (
              <>
                <br />
                가입 후 작품 탐색, 후원, 라이브러리 기능을 이어서 사용할 수 있어요.
              </>
            ) : null}
          </p>
        </div>

        <div className="mt-4 flex w-full flex-col gap-4">
          {initialAuth?.isLoggedIn ? (
            <Link
              href={continueHref}
              className="flex w-full items-center justify-center rounded-xl bg-white py-4 font-semibold tracking-wide text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98]"
            >
              {initialAuth.userNickname} 계정으로 계속
            </Link>
          ) : storedAccount ? (
            <button
              type="button"
              onClick={handleStoredAccountContinue}
              disabled={isRestoringAccount}
              className="flex w-full items-center justify-center rounded-xl bg-white py-4 font-semibold tracking-wide text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRestoringAccount ? '계정 확인 중...' : `${storedAccount.displayName} 계정으로 계속`}
            </button>
          ) : (
            <Link
              href={signUpHref}
              className="flex w-full items-center justify-center rounded-xl bg-white py-4 font-semibold tracking-wide text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98]"
            >
              회원가입으로 시작
            </Link>
          )}

          {restoreError ? (
            <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
              {restoreError}
            </p>
          ) : null}

          <Link
            href={signInHref}
            className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-4 font-medium text-zinc-200 transition-colors hover:scale-[1.02] hover:bg-white/10 active:scale-[0.98]"
          >
            {initialAuth?.isLoggedIn || storedAccount ? '다른 계정으로 로그인' : '로그인'}
          </Link>

          {initialAuth?.isLoggedIn || storedAccount ? (
            <Link
              href={signUpHref}
              className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-4 font-medium text-zinc-200 transition-colors hover:scale-[1.02] hover:bg-white/10 active:scale-[0.98]"
            >
              새 계정 만들기
            </Link>
          ) : null}

          {!initialAuth?.isLoggedIn ? (
            <Link
              href="/main"
              className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-4 font-medium text-zinc-300 transition-colors hover:scale-[1.02] hover:bg-white/10 active:scale-[0.98]"
            >
              게스트로 둘러보기
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  )
}
