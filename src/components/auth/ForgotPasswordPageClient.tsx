'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'
import { sanitizeInternalPath } from '@/lib/guest-policy'
import { createClient } from '@/lib/supabase/client'

type ResetStep = 'request-code' | 'verify-code'

export function ForgotPasswordPageClient({
  nextPath,
}: {
  nextPath: string | null
}) {
  const router = useRouter()
  const [step, setStep] = useState<ResetStep>('request-code')
  const [email, setEmail] = useState('')
  const [requestedEmail, setRequestedEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectPath = sanitizeInternalPath(nextPath, '/main')
  const encodedNextPath = encodeURIComponent(redirectPath)
  const backHref = `/auth/sign-in?next=${encodedNextPath}`

  const requestResetCode = async () => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setErrorMessage('인증코드를 받을 이메일을 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setMessage('')

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/reset-password?next=${encodedNextPath}`
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage('인증코드 요청 중 문제가 발생했습니다. 이메일 형식을 확인한 뒤 다시 시도해 주세요.')
      return
    }

    setRequestedEmail(trimmedEmail)
    setStep('verify-code')
    setMessage('가입된 이메일이라면 인증코드를 보냈습니다. 메일함을 확인해 주세요.')
  }

  const handleRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await requestResetCode()
  }

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedCode = verificationCode.trim()

    if (!requestedEmail) {
      setStep('request-code')
      setErrorMessage('먼저 인증코드를 받을 이메일을 입력해 주세요.')
      return
    }

    if (!trimmedCode) {
      setErrorMessage('메일로 받은 인증코드를 입력해 주세요.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('새 비밀번호는 6자 이상으로 입력해 주세요.')
      return
    }

    if (password !== passwordConfirm) {
      setErrorMessage('새 비밀번호와 확인 입력이 서로 다릅니다.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: requestedEmail,
      token: trimmedCode,
      type: 'recovery',
    })

    if (verifyError) {
      setIsSubmitting(false)
      setErrorMessage('인증코드가 만료되었거나 올바르지 않습니다. 메일의 최신 코드를 다시 확인해 주세요.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setIsSubmitting(false)

    if (updateError) {
      setErrorMessage('비밀번호를 저장하지 못했습니다. 인증코드를 다시 요청해 주세요.')
      return
    }

    setMessage('비밀번호가 변경되었습니다. 새 비밀번호로 계속 사용할 수 있습니다.')
    router.replace(redirectPath)
    router.refresh()
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <header className="z-20 flex items-center justify-between">
        <PageBackLink href={backHref} />
        <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">Email Code</span>
      </header>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-white/5 blur-[100px]" />
      </div>

      <div className="z-10 mx-auto flex w-full max-w-lg flex-1 items-center py-8">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-10">
          <div className="mb-8 space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">비밀번호 재설정</h1>
            <p className="text-sm leading-6 text-zinc-400 md:text-base">
              가입한 이메일로 인증코드를 받은 뒤 새 비밀번호를 설정할 수 있습니다.
            </p>
          </div>

          {step === 'request-code' ? (
            <form onSubmit={handleRequestSubmit} className="grid gap-5">
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

              {errorMessage ? (
                <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {errorMessage}
                </p>
              ) : null}

              {message ? (
                <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? '인증코드 요청 중...' : '인증코드 받기'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="grid gap-5">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-300">
                <strong className="font-semibold text-white">{requestedEmail}</strong>로 보낸 인증코드를 입력해 주세요.
              </div>

              <label className="block space-y-2">
                <span className="text-sm text-zinc-300">인증코드</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="6자리 코드"
                  autoComplete="one-time-code"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-zinc-300">새 비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="6자 이상"
                  autoComplete="new-password"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-zinc-300">새 비밀번호 확인</span>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="한 번 더 입력"
                  autoComplete="new-password"
                />
              </label>

              {errorMessage ? (
                <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {errorMessage}
                </p>
              ) : null}

              {message ? (
                <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? '확인 중...' : '인증하고 비밀번호 변경'}
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={requestResetCode}
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  인증코드 다시 받기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('request-code')
                    setMessage('')
                    setErrorMessage('')
                  }}
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  이메일 다시 입력
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-400">
            비밀번호가 기억났다면{' '}
            <Link href={backHref} className="font-semibold text-white underline underline-offset-4">
              {BRAND.name} 로그인
            </Link>
            으로 돌아갈 수 있습니다.
          </div>
        </div>
      </div>
    </main>
  )
}
