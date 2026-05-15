'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'
import { getJoinPromptHref, sanitizeInternalPath } from '@/lib/guest-policy'
import { createClient } from '@/lib/supabase/client'

function getReadableSignInErrorMessage(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase()

  if (normalizedMessage.includes('email not confirmed')) {
    return '계정은 있지만 이메일 확인이 완료되지 않았습니다. 가입 메일함을 확인해 주세요.'
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return '로그인 정보가 맞지 않습니다. 가입한 이메일이 맞다면 비밀번호를 다시 확인해 주세요. 가입한 적이 없다면 회원가입을 먼저 진행해 주세요.'
  }

  if (normalizedMessage.includes('too many')) {
    return '로그인 시도가 잠시 제한되었습니다. 조금 뒤에 다시 시도해 주세요.'
  }

  return '로그인 정보를 확인하지 못했습니다. 이메일과 비밀번호를 다시 확인해 주세요.'
}

export function SignInPageClient({
  nextPath,
}: {
  nextPath: string | null
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectPath = sanitizeInternalPath(nextPath, '/main')
  const encodedNextPath = encodeURIComponent(redirectPath)
  const backHref = nextPath ? getJoinPromptHref(nextPath) : '/join-prompt'
  const signUpHref = `/auth/sign-up?next=${encodedNextPath}`
  const forgotPasswordHref = `/auth/forgot-password?next=${encodedNextPath}`

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password) {
      setErrorMessage('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setNeedsEmailVerification(false)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setIsSubmitting(false)
      setNeedsEmailVerification(error.message.toLowerCase().includes('email not confirmed'))
      setErrorMessage(getReadableSignInErrorMessage(error.message))
      return
    }

    setIsSubmitting(false)
    router.replace(redirectPath)
    router.refresh()
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <header className="z-20 flex items-center justify-between">
        <PageBackLink href={backHref} />
        <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">Sign In</span>
      </header>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-white/5 blur-[100px]" />
      </div>

      <div className="z-10 mx-auto flex w-full max-w-lg flex-1 items-center py-8">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-10">
          <div className="mb-8 space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">{BRAND.name} 로그인</h1>
            <p className="text-sm leading-6 text-zinc-400 md:text-base">
              이미 만든 계정으로 이어서 둘러보고, 라이브러리와 작가 스튜디오 기록을 계속 사용할 수 있습니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">이메일</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="비밀번호"
                autoComplete="current-password"
              />
            </label>

            <div className="-mt-2 flex justify-end">
              <Link
                href={forgotPasswordHref}
                className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-black/20 px-4 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <p>{errorMessage}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={signUpHref}
                    className="inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-zinc-200 transition hover:bg-white/10"
                  >
                    회원가입하기
                  </Link>
                  {needsEmailVerification ? (
                    <Link
                      href={`/auth/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&next=${encodedNextPath}`}
                      className="inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-zinc-200 transition hover:bg-white/10"
                    >
                      인증코드 입력
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setPassword('')}
                    className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
                  >
                    비밀번호 다시 입력
                  </button>
                  <Link
                    href={forgotPasswordHref}
                    className="inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-zinc-200 transition hover:bg-white/10"
                  >
                    비밀번호 재설정
                  </Link>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-400">
            아직 계정이 없다면{' '}
            <Link href={signUpHref} className="font-semibold text-white underline underline-offset-4">
              회원가입
            </Link>
            으로 시작할 수 있습니다.
          </div>
        </div>
      </div>
    </main>
  )
}
