'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { replaceAfterAuth } from '@/lib/auth/navigation'
import { BRAND } from '@/lib/brand'
import { sanitizeInternalPath } from '@/lib/guest-policy'
import { createClient } from '@/lib/supabase/client'

type ResetStep = 'request-code' | 'verify-code'

function isSamePasswordError(error: { code?: string; message: string }) {
  const normalizedMessage = error.message.toLowerCase()

  return error.code === 'same_password' || normalizedMessage.includes('same password')
}

function getPasswordUpdateErrorMessage(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase()

  if (normalizedMessage.includes('session')) {
    return '인증 세션이 만료되었습니다. 인증코드를 다시 요청한 뒤 바로 비밀번호를 변경해 주세요.'
  }

  if (
    normalizedMessage.includes('password') ||
    normalizedMessage.includes('weak') ||
    normalizedMessage.includes('short')
  ) {
    return '새 비밀번호 조건을 충족하지 못했습니다. 8자 이상으로 다시 입력해 주세요.'
  }

  return '비밀번호를 저장하지 못했습니다. 입력한 새 비밀번호를 확인한 뒤 다시 시도해 주세요.'
}

export function ForgotPasswordPageClient({
  nextPath,
}: {
  nextPath: string | null
}) {
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
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      setErrorMessage('인증코드를 받을 이메일을 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setMessage('')

    const response = await fetch('/api/auth/password-reset-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: trimmedEmail,
        nextPath: redirectPath,
      }),
    })

    setIsSubmitting(false)

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null
      setErrorMessage(
        result?.error ?? '인증코드 요청 중 문제가 발생했습니다. 이메일 형식을 확인한 뒤 다시 시도해 주세요.'
      )
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

    if (password.length < 8) {
      setErrorMessage('새 비밀번호는 8자 이상으로 입력해 주세요.')
      return
    }

    if (password !== passwordConfirm) {
      setErrorMessage('새 비밀번호와 확인 입력이 서로 다릅니다.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const supabase = createClient()
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: requestedEmail,
      token: trimmedCode,
      type: 'recovery',
    })

    if (verifyError) {
      setIsSubmitting(false)
      setErrorMessage('인증코드가 만료되었거나 올바르지 않습니다. 메일의 최신 코드를 다시 확인해 주세요.')
      return
    }

    if (verifyData.session) {
      await supabase.auth.setSession({
        access_token: verifyData.session.access_token,
        refresh_token: verifyData.session.refresh_token,
      })
    }

    const { error: existingPasswordError } = await supabase.auth.signInWithPassword({
      email: requestedEmail,
      password,
    })

    if (!existingPasswordError) {
      setIsSubmitting(false)
      setErrorMessage('')
      setMessage('입력한 비밀번호가 기존 비밀번호와 일치합니다. 비밀번호 변경 없이 로그인합니다.')
      replaceAfterAuth(redirectPath, 900)
      return
    }

    if (verifyData.session) {
      await supabase.auth.setSession({
        access_token: verifyData.session.access_token,
        refresh_token: verifyData.session.refresh_token,
      })
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      nonce: trimmedCode,
    })

    setIsSubmitting(false)

    if (updateError) {
      if (isSamePasswordError(updateError)) {
        setErrorMessage('')
        setMessage('입력한 비밀번호가 기존 비밀번호와 같습니다. 비밀번호 변경 없이 로그인 상태로 이어갑니다.')
        replaceAfterAuth(redirectPath, 900)
        return
      }

      setErrorMessage(getPasswordUpdateErrorMessage(updateError.message))
      return
    }

    setMessage('비밀번호가 변경되었습니다. 새 비밀번호로 계속 사용할 수 있습니다.')
    replaceAfterAuth(redirectPath)
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
                  placeholder="메일로 받은 코드"
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
                  placeholder="8자 이상 권장"
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
