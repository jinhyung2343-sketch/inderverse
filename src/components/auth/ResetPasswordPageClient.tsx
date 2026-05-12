'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { sanitizeInternalPath } from '@/lib/guest-policy'
import { createClient } from '@/lib/supabase/client'

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

export function ResetPasswordPageClient({
  nextPath,
}: {
  nextPath: string | null
}) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [statusMessage, setStatusMessage] = useState('메일 링크를 확인하는 중입니다.')
  const [errorMessage, setErrorMessage] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectPath = sanitizeInternalPath(nextPath, '/main')
  const encodedNextPath = encodeURIComponent(redirectPath)
  const signInHref = `/auth/sign-in?next=${encodedNextPath}`

  useEffect(() => {
    let isMounted = true

    async function prepareRecoverySession() {
      const supabase = createClient()
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')
      const accessToken = readHashParam('access_token')
      const refreshToken = readHashParam('refresh_token')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          if (isMounted) {
            setStatusMessage('')
            setErrorMessage('비밀번호 재설정 링크가 만료되었거나 올바르지 않습니다. 재설정 메일을 다시 요청해 주세요.')
          }
          return
        }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          if (isMounted) {
            setStatusMessage('')
            setErrorMessage('비밀번호 재설정 링크가 만료되었거나 올바르지 않습니다. 재설정 메일을 다시 요청해 주세요.')
          }
          return
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (!session) {
        setStatusMessage('')
        setErrorMessage('재설정 세션을 찾지 못했습니다. 메일의 재설정 링크로 다시 들어와 주세요.')
        return
      }

      setErrorMessage('')
      setStatusMessage('새 비밀번호를 입력해 주세요.')
      setIsReady(true)
    }

    void prepareRecoverySession()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

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
    const { error } = await supabase.auth.updateUser({ password })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage('비밀번호를 저장하지 못했습니다. 재설정 링크를 다시 요청해 주세요.')
      return
    }

    setStatusMessage('비밀번호가 변경되었습니다. 새 비밀번호로 계속 사용할 수 있습니다.')
    router.replace(redirectPath)
    router.refresh()
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <header className="z-20 flex items-center justify-between">
        <PageBackLink href={signInHref} />
        <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">New Password</span>
      </header>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-white/5 blur-[100px]" />
      </div>

      <div className="z-10 mx-auto flex w-full max-w-lg flex-1 items-center py-8">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-10">
          <div className="mb-8 space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">새 비밀번호 설정</h1>
            <p className="text-sm leading-6 text-zinc-400 md:text-base">
              메일 링크 확인이 끝나면 새 비밀번호를 저장할 수 있습니다.
            </p>
          </div>

          {statusMessage ? (
            <p className="mb-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
              {statusMessage}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">새 비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={!isReady}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
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
                disabled={!isReady}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="한 번 더 입력"
                autoComplete="new-password"
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <p>{errorMessage}</p>
                <Link
                  href={`/auth/forgot-password?next=${encodedNextPath}`}
                  className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
                >
                  재설정 메일 다시 받기
                </Link>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!isReady || isSubmitting}
              className="w-full rounded-2xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? '저장 중...' : '새 비밀번호 저장'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
