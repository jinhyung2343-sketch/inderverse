import { BRAND } from '@/lib/brand'

export default function MainHubLoading() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] text-white selection:bg-white/30">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[640px] max-w-[640px] rounded-full bg-white/5 blur-[110px]" />
      </div>

      <div className="z-10 flex flex-col items-center gap-5 text-center">
        <p className="text-2xl font-black tracking-tighter text-white md:text-4xl">{BRAND.name}</p>
        <div className="h-1 w-28 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full animate-pulse rounded-full bg-white/70" />
        </div>
      </div>
    </main>
  )
}
