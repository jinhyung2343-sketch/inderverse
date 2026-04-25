import { BRAND } from '@/lib/brand'

const checkpoints = [
  '코인 충전은 서버 검증 이후에만 활성화되도록 잠겨 있습니다.',
  '유료 코인과 무료 코인을 분리 관리해 정산 기준을 명확히 유지합니다.',
  `작가 배분은 채널별로 ${BRAND.defaultCreatorSharePct}%~${BRAND.maxCreatorSharePct}% 사이에서 설정됩니다.`,
]

export default function StorePage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Store</p>
          <h1 className="text-4xl font-black tracking-tight">코인 및 결제 구조</h1>
          <p className="text-zinc-400">
            현재는 프로토타입 결제 API와 지갑 원장이 연결된 상태이며, 실제 PG 검증과 정산 파이프라인을 이어 붙일 준비가 되어 있습니다.
          </p>
        </header>

        <section className="rounded-3xl border border-amber-400/20 bg-amber-500/5 p-6">
          <ul className="space-y-3 text-sm leading-6 text-zinc-300">
            {checkpoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
