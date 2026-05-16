export function RouteLoadingShell({ label = '불러오는 중' }: { label?: string }) {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="space-y-4 border-b border-white/10 pb-6">
          <div className="h-11 w-11 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="h-10 w-56 animate-pulse rounded-lg bg-white/10" />
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-lg border border-white/10 bg-white/[0.055]" />
          ))}
        </section>

        <p className="sr-only">{label}</p>
      </div>
    </main>
  )
}
