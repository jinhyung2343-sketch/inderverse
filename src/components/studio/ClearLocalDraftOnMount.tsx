'use client'

import { useEffect } from 'react'

export function ClearLocalDraftOnMount({ storageKey }: { storageKey?: string | null }) {
  useEffect(() => {
    if (!storageKey?.startsWith('inderverse:webtoon-channel-draft:')) {
      return
    }

    window.localStorage.removeItem(storageKey)

    const url = new URL(window.location.href)
    url.searchParams.delete('clearDraftKey')
    url.searchParams.delete('deleted')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [storageKey])

  return null
}
