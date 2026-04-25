'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/brand'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!displayName.trim() || !email.trim() || password.length < 6) {
      setErrorMessage('닉네임, 이메일, 비밀번호 6자 이상을 확인해주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    router.replace('/main')
    router.refresh()
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <header className="z-20 flex items-center justify-between">
        <Link
          href="/join-prompt"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10"
          aria-label="뒤로 가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">Sign Up</span>
      </header>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-white/5 blur-[100px]"></div>
      </div>

      <div className="z-10 mx-auto flex w-full max-w-md flex-1 items-center">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="mb-8 space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">{BRAND.name} 회원가입</h1>
            <p className="text-sm leading-6 text-zinc-400">
              작가와 독자가 각자의 흐름을 직접 만들 수 있도록, 가장 기본이 되는 계정부터 연결합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">닉네임</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="표시될 이름"
                autoComplete="nickname"
              />
            </label>

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
                placeholder="6자 이상"
                autoComplete="new-password"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? '가입 중...' : '회원가입 완료'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
