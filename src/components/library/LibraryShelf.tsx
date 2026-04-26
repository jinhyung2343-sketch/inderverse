'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArtworkCard } from '@/components/ui/ArtworkCard'
import { artworks } from '@/lib/mock/explore-data'
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

export function LibraryShelf() {
  const [savedIds, setSavedIds] = useState<string[]>([])
  const { user, checkSession } = useAuthStore()
  const scope = getUserScope(user?.id)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    const sync = () => setSavedIds(readLibrary(scope))
    sync()
    window.addEventListener('inderverse-library-updated', sync)
    return () => window.removeEventListener('inderverse-library-updated', sync)
  }, [scope])

  const savedArtworks = artworks.filter((artwork) => savedIds.includes(artwork.id))

  if (savedArtworks.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-6 text-zinc-300">
        아직 담아둔 작품이 없습니다. 작품 상세에서 `라이브러리에 담기`를 누르면 이곳에 쌓입니다.
      </section>
    )
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
        저장한 작품 {savedArtworks.length}개가 라이브러리에 담겨 있습니다.
      </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {savedArtworks.map((artwork) => (
          <ArtworkCard
            key={artwork.id}
            id={artwork.id}
            title={artwork.title}
            authorName={artwork.authorName}
            coverImageUrl={artwork.coverImageUrl}
            status={artwork.status}
            isAdultOnly={artwork.isAdultOnly}
            isCommentEnabled={artwork.isCommentEnabled}
            tags={artwork.tags}
            href={`/main/explore/${artwork.id}`}
          />
        ))}
      </div>

      <Link href="/main/explore" className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10">
        작품 더 둘러보기
      </Link>
    </section>
  )
}
