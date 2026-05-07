'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { getJoinPromptHref, LOGIN_REQUIRED_MESSAGE } from '@/lib/guest-policy'

export function LoginRequiredAction({
  children,
  nextPath,
  className = 'inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200',
}: {
  children: ReactNode
  nextPath: string
  className?: string
}) {
  const [message, setMessage] = useState('')

  return (
    <div className="grid gap-2">
      <button type="button" onClick={() => setMessage(LOGIN_REQUIRED_MESSAGE)} className={className}>
        {children}
      </button>
      {message ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-zinc-200">
          <p>{message}</p>
          <Link
            href={getJoinPromptHref(nextPath)}
            className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-zinc-300 transition hover:bg-white/10"
          >
            로그인 화면으로 이동
          </Link>
        </div>
      ) : null}
    </div>
  )
}
