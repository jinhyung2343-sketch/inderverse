import Link from 'next/link'
import { getBottegaHref, getBottegaLabel, type PrimaryBottegaWorkType } from '@/lib/bottega'
import { bottegaGenres } from '@/lib/bottega-catalog'

type BottegaSwitcherProps = {
  currentWorkType?: PrimaryBottegaWorkType | null
  align?: 'left' | 'right'
}

export function BottegaSwitcher({ currentWorkType, align = 'right' }: BottegaSwitcherProps) {
  const currentLabel = getBottegaLabel(currentWorkType)

  return (
    <details className="group relative">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10 [&::-webkit-details-marker]:hidden">
        장르 작업실
      </summary>
      <div
        className={`absolute z-30 mt-3 w-[min(92vw,420px)] rounded-lg border border-white/10 bg-[#101010] p-3 text-left shadow-2xl shadow-black/40 ${
          align === 'left' ? 'left-0' : 'right-0'
        }`}
      >
        <div className="border-b border-white/10 px-2 pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">My Bottega</p>
          <p className="mt-1 text-sm text-zinc-300">현재 기본 작업실: {currentLabel}</p>
        </div>

        <div className="mt-3 grid gap-2">
          {bottegaGenres.map((genre) => {
            const isCurrent = genre.workType === currentWorkType

            if (genre.isReady && genre.workType) {
              return (
                <Link
                  key={genre.id}
                  href={getBottegaHref(genre.workType)}
                  className="rounded-lg border border-white/10 bg-white/[0.045] p-3 transition hover:border-white/25 hover:bg-white/[0.08]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{genre.title}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">{genre.note}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${genre.accentClassName}`}>
                      {isCurrent ? '현재' : '열기'}
                    </span>
                  </div>
                </Link>
              )
            }

            return (
              <div key={genre.id} className="rounded-lg border border-dashed border-white/10 bg-white/[0.025] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-300">{genre.title}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{genre.note}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${genre.accentClassName}`}>
                    준비 중
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <Link
          href="/main/studio/creator-channel"
          className="mt-3 flex rounded-lg border border-white/10 bg-white text-center text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          <span className="w-full px-4 py-3">내 작가 페이지 관리</span>
        </Link>
      </div>
    </details>
  )
}
