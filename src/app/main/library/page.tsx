import Link from 'next/link'
import { SavedSparkShelf } from '@/components/library/SavedSparkShelf'
import { LibraryShelf } from '@/components/library/LibraryShelf'
import { getSavedSparkList } from '@/lib/server/spark'
import { getSavedArtworks } from '@/lib/server/library'

export default async function LibraryPage() {
  const savedSparks = await getSavedSparkList()
  const savedArtworks = await getSavedArtworks()

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Library</p>
            <h1 className="text-4xl font-black tracking-tight">내 라이브러리</h1>
            <p className="text-zinc-400">
              구매 이력, 기다리면 무료 해금, 성인 인증 후 접근 가능한 작품까지 한 화면에서 이어보는 개인 서재 영역입니다.
            </p>
          </div>

          <Link
            href="/main"
            className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            허브로 돌아가기
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Saved Sparks</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">저장한 스파크</h2>
            </div>
            <SavedSparkShelf sparks={savedSparks} />
          </div>

          <div className="grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Saved Artworks</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">담아둔 작품</h2>
            </div>
            <LibraryShelf artworks={savedArtworks} />
          </div>
        </section>
      </div>
    </main>
  )
}
