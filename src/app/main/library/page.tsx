import { LibraryShelf } from '@/components/library/LibraryShelf'

export default function LibraryPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Library</p>
          <h1 className="text-4xl font-black tracking-tight">내 라이브러리</h1>
          <p className="text-zinc-400">
            구매 이력, 기다리면 무료 해금, 성인 인증 후 접근 가능한 작품까지 한 화면에서 이어보는 개인 서재 영역입니다.
          </p>
        </header>

        <LibraryShelf />
      </div>
    </main>
  )
}
