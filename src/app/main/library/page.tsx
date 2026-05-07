import Link from 'next/link'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { SavedSparkShelf } from '@/components/library/SavedSparkShelf'
import { LibraryShelf } from '@/components/library/LibraryShelf'
import { getSavedSparkList } from '@/lib/server/spark'
import { getSavedArtworks } from '@/lib/server/library'
import { createClient } from '@/lib/supabase/server'
import { getJoinPromptHref } from '@/lib/guest-policy'

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const savedSparks = await getSavedSparkList()
  const savedArtworks = await getSavedArtworks()
  const isGuest = !user

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href="/main" ariaLabel="허브로 돌아가기" />

        <header>
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Library</p>
            <h1 className="text-4xl font-black tracking-tight">내 라이브러리</h1>
            <p className="text-zinc-400">
              구매 이력, 기다리면 무료 해금, 성인 인증 후 접근 가능한 작품까지 한 화면에서 이어보는 개인 서재 영역입니다.
            </p>
          </div>
        </header>

        {isGuest ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-zinc-300 backdrop-blur">
            <p className="font-semibold text-white">게스트 모드에서는 라이브러리 구조를 둘러볼 수 있습니다.</p>
            <p className="mt-2">
              저장한 스파크, 담아둔 작품, 구매/해금 상태는 계정 기준으로 기록됩니다. 저장이나 이어보기 기록을 남기려면 로그인이 필요합니다.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={getJoinPromptHref('/main/library')}
                className="inline-flex rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                로그인하고 기록 동기화
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Saved Sparks</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">저장한 스파크</h2>
            </div>
            <SavedSparkShelf sparks={savedSparks} isGuest={isGuest} />
          </div>

          <div className="grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Saved Artworks</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">담아둔 작품</h2>
            </div>
            <LibraryShelf artworks={savedArtworks} isGuest={isGuest} />
          </div>
        </section>
      </div>
    </main>
  )
}
