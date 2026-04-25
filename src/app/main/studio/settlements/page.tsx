import { BRAND } from '@/lib/brand'

const settlementRules = [
  `작가 배분율은 채널별로 ${BRAND.defaultCreatorSharePct}%~${BRAND.maxCreatorSharePct}% 사이에서 직접 설정합니다.`,
  '정산 시점에는 배분율 스냅샷을 settlements 테이블에 저장해 이후 변경과 분리합니다.',
  '무료 코인 사용액과 유료 코인 사용액을 분리해 실제 정산 대상 매출을 구분합니다.',
]

export default function StudioSettlementsPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Settlements</p>
          <h1 className="text-4xl font-black tracking-tight">정산 구조</h1>
        </header>

        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6">
          <ul className="space-y-3 text-sm leading-6 text-zinc-300">
            {settlementRules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
