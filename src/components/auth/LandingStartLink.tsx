'use client'

import Link from 'next/link'
import { MouseEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'

const JOIN_PROMPT_HREF = '/join-prompt?next=%2Fmain'
const MAIN_HREF = '/main'

export function LandingStartLink({ initialHref }: { initialHref: string }) {
  const router = useRouter()
  const checkSession = useAuthStore((state) => state.checkSession)
  const [href, setHref] = useState(initialHref)

  useEffect(() => {
    let isMounted = true

    checkSession().finally(() => {
      if (!isMounted) {
        return
      }

      setHref(useAuthStore.getState().isLoggedIn ? MAIN_HREF : JOIN_PROMPT_HREF)
    })

    return () => {
      isMounted = false
    }
  }, [checkSession])

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!useAuthStore.getState().isLoggedIn) {
      return
    }

    event.preventDefault()
    router.push(MAIN_HREF)
    router.refresh()
  }

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={handleClick}
      className="group relative inline-flex items-center justify-center px-12 py-4 font-medium text-white transition-all duration-700 ease-out"
    >
      <span className="absolute inset-0 h-full w-full rounded-full border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-700 ease-out group-hover:border-white/30 group-hover:bg-white/10 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] group-active:scale-95"></span>
      <span className="relative text-sm tracking-widest transition-transform duration-700 group-hover:scale-105">
        시작하기
      </span>
    </Link>
  )
}
