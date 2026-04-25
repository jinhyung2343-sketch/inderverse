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

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-6 text-zinc-300">
          라이브러리 UI는 아직 본격 구현 전이지만, 구매 내역과 해금 내역을 받쳐주는 데이터 모델은 이미 준비되어 있습니다.
        </section>
      </div>
    </main>
  )
}
