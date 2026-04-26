'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { getScopedStorageKey, getUserScope } from '@/lib/mock/user-scope-client'

const STORAGE_KEY = 'inderverse-library'

function readLibrary(scope: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(getScopedStorageKey(STORAGE_KEY, scope))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLibrary(scope: string, ids: string[]) {
  window.localStorage.setItem(getScopedStorageKey(STORAGE_KEY, scope), JSON.stringify(ids))
  window.dispatchEvent(new CustomEvent('inderverse-library-updated'))
}

export function LibraryToggleButton({
  artworkId,
  artworkTitle,
}: {
  artworkId: string
  artworkTitle: string
}) {
  const [saved, setSaved] = useState(false)
  const { user, checkSession } = useAuthStore()
  const scope = getUserScope(user?.id)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    const sync = () => setSaved(readLibrary(scope).includes(artworkId))
    sync()
    window.addEventListener('inderverse-library-updated', sync)
    return () => window.removeEventListener('inderverse-library-updated', sync)
  }, [artworkId, scope])

  const handleToggle = () => {
    const current = readLibrary(scope)
    const next = current.includes(artworkId)
      ? current.filter((id) => id !== artworkId)
      : [...current, artworkId]

    writeLibrary(scope, next)
    setSaved(next.includes(artworkId))
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={saved}
      aria-label={saved ? `${artworkTitle} 라이브러리에서 제거` : `${artworkTitle} 라이브러리에 저장`}
      className={`rounded-full px-5 py-3 text-sm transition ${
        saved
          ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15'
          : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
      }`}
    >
      {saved ? '라이브러리에 저장됨' : '라이브러리에 담기'}
    </button>
  )
}
