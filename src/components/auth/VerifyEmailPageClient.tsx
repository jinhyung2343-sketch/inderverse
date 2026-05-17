'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'
import { sanitizeInternalPath } from '@/lib/guest-policy'
import { createClient } from '@/lib/supabase/client'

type EmailLinkOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'

const emailLinkOtpTypes = new Set<EmailLinkOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

function readHashParam(key: string) {
  if (typeof window === 'undefined') {
    return null
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const params = new URLSearchParams(hash)
  return params.get(key)
}

async function requestWelcomeEmail() {
  try {
    await fetch('/api/email/welcome', { method: 'POST' })
  } catch (welcomeEmailError) {
    console.warn('Unable to request welcome email:', welcomeEmailError)
  }
}

export function VerifyEmailPageClient({
  email,
  nextPath,
  authError,
}: {
  email: string | null
  nextPath: string | null
  authError: string | null
}) {
  const router = useRouter()
  const [verificationEmail, setVerificationEmail] = useState(email ?? '')
  const [verificationCode, setVerificationCode] = useState('')
  const [message, setMessage] = useState(
    email ? '가입 메일함으로 보낸 인증코드를 입력해 주세요.' : ''
  )
  const [errorMessage, setErrorMessage] = useState(
    authError
      ? '인증 링크가 만료되었거나 허용되지 않았습니다. 아래에서 인증코드를 다시 받아 진행해 주세요.'
      : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isLinkVerifying, setIsLinkVerifying] = useState(false)
  const redirectPath = sanitizeInternalPath(nextPath, '/main')
  const encodedNextPath = encodeURIComponent(redirectPath)
  const signInHref = `/auth/sign-in?next=${encodedNextPath}`

  const normalizedEmail = verificationEmail.trim().toLowerCase()
  const trimmedCode = verificationCode.trim()

  useEffect(() => {
    let isMounted = true

    async function verifyEmailLink() {
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')
      const tokenHash = searchParams.get('token_hash')
      const rawType = searchParams.get('type')
      const hashAccessToken = readHashParam('access_token')
      const hashRefreshToken = readHashParam('refresh_token')
      const hasLinkVerificationParams = Boolean(code || tokenHash || (hashAccessToken && hashRefreshToken))

      if (!hasLinkVerificationParams) {
        return
      }

      setIsLinkVerifying(true)
      setErrorMessage('')
      setMessage('메일 인증 링크를 확인하는 중입니다.')

      const supabase = createClient()
      let verifyError: { message?: string } | null = null

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        verifyError = error
      } else if (tokenHash) {
        const linkType: EmailLinkOtpType =
          rawType && emailLinkOtpTypes.has(rawType as EmailLinkOtpType)
            ? (rawType as EmailLinkOtpType)
            : 'signup'
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: linkType,
        })
        verifyError = error
      } else if (hashAccessToken && hashRefreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: hashAccessToken,
          refresh_token: hashRefreshToken,
        })
        verifyError = error
      }

      if (!isMounted) {
        return
      }

      setIsLinkVerifying(false)

      if (verifyError) {
        setMessage('')
        setErrorMessage('인증 링크가 만료되었거나 허용되지 않았습니다. 아래에서 인증코드를 다시 받아 진행해 주세요.')
        return
      }

      await requestWelcomeEmail()

      if (!isMounted) {
        return
      }

      setErrorMessage('')
      setMessage('이메일 인증이 완료되었습니다.')
      router.replace(redirectPath)
      router.refresh()
    }

    void verifyEmailLink()

    return () => {
      isMounted = false
    }
  }, [redirectPath, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!normalizedEmail) {
      setErrorMessage('인증코드를 받을 이메일을 입력해 주세요.')
      return
    }

    if (!trimmedCode) {
      setErrorMessage('메일로 받은 인증코드를 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const supabase = createClient()
    let { error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: trimmedCode,
      type: 'signup',
    })

    if (error) {
      const result = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: trimmedCode,
        type: 'email',
      })
      error = result.error
    }

    if (error) {
      const result = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: trimmedCode,
        type: 'magiclink',
      })
      error = result.error
    }

    setIsSubmitting(false)

    if (error) {
      setErrorMessage('인증코드가 만료되었거나 올바르지 않습니다. 메일의 최신 코드를 다시 확인해 주세요.')
      return
    }

    await requestWelcomeEmail()

    setMessage('이메일 인증이 완료되었습니다.')
    router.replace(redirectPath)
    router.refresh()
  }

  const handleResend = async () => {
    if (!normalizedEmail) {
      setErrorMessage('인증코드를 다시 받을 이메일을 입력해 주세요.')
      return
    }

    setIsResending(true)
    setErrorMessage('')
    setMessage('')

    const response = await fetch('/api/auth/resend-signup-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        nextPath: redirectPath,
      }),
    })

    setIsResending(false)

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null
      setErrorMessage(
        result?.error ?? '인증코드를 다시 보내지 못했습니다. 이메일을 확인한 뒤 잠시 후 다시 시도해 주세요.'
      )
      return
    }

    setMessage('인증코드를 다시 보냈습니다. 가입 메일함을 확인해 주세요.')
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <header className="z-20 flex items-center justify-between">
        <PageBackLink href={signInHref} />
        <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">Email Verify</span>
      </header>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-white/5 blur-[100px]" />
      </div>

      <div className="z-10 mx-auto flex w-full max-w-lg flex-1 items-center py-8">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-10">
          <div className="mb-8 space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">이메일 인증</h1>
            <p className="text-sm leading-6 text-zinc-400 md:text-base">
              {BRAND.name} 가입을 완료하려면 메일로 받은 인증코드를 입력해 주세요.
              메일의 확인 버튼을 눌러 들어온 경우에는 자동으로 인증을 마무리합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">이메일</span>
              <input
                type="email"
                value={verificationEmail}
                onChange={(event) => setVerificationEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

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
              disabled={isSubmitting || isResending || isLinkVerifying}
              className="w-full rounded-2xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLinkVerifying ? '메일 링크 확인 중...' : isSubmitting ? '인증 중...' : '인증하고 시작하기'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting || isResending || isLinkVerifying}
              className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending ? '다시 보내는 중...' : '인증코드 다시 받기'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-400">
            이미 인증을 마쳤다면{' '}
            <Link href={signInHref} className="font-semibold text-white underline underline-offset-4">
              로그인
            </Link>
            으로 이어서 사용할 수 있습니다.
          </div>
        </div>
      </div>
    </main>
  )
}
