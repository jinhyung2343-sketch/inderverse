import Link from 'next/link'
import { ArtworkCard } from '@/components/ui/ArtworkCard'
import type { ExploreArtwork } from '@/lib/explore'

export function LibraryShelf({ artworks, isGuest = false }: { artworks: ExploreArtwork[]; isGuest?: boolean }) {
  const savedArtworks = artworks

  if (savedArtworks.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-6 text-zinc-300">
        {isGuest
          ? '담아둔 작품과 구매/해금 상태는 로그인 후 계정 기준으로 표시됩니다. 게스트 모드에서는 서재 구조만 확인할 수 있습니다.'
          : '아직 담아둔 작품이 없습니다. 작품 상세에서 `라이브러리에 담기`를 누르면 서버 라이브러리에 쌓입니다.'}
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
            title={artwork.title}
            authorName={artwork.authorName}
            authorHref={artwork.creatorSlug ? `/main/creators/${artwork.creatorSlug}` : undefined}
            coverImageUrl={artwork.coverImageUrl}
            workType={artwork.workType}
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
