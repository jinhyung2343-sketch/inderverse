import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'

const INDERIUM_UNIT_PRICE = 100

const chargeOptions = [
  { amount: 1000, label: '가볍게 시작', note: '첫 유료 회차를 열어보기 좋은 단위입니다.' },
  { amount: 5000, label: '기본 충전', note: '여러 회차를 이어볼 때 가장 무난한 단위입니다.' },
  { amount: 10000, label: '정주행 준비', note: '관심 작품을 묶어서 볼 때 적합한 단위입니다.' },
  { amount: 30000, label: '넉넉한 지갑', note: '장기 이용자를 위한 대용량 충전 단위입니다.' },
]

const walletNotes = [
  {
    title: '유료 인더륨',
    description: '결제로 충전한 인더륨입니다. 작품 구매와 정산 기준 매출에 연결됩니다.',
  },
  {
    title: '무료 인더륨',
    description: '이벤트나 보너스로 지급되는 인더륨입니다. 유료 인더륨과 분리해 기록합니다.',
  },
  {
    title: '정산 연결',
    description: `유료 인더륨 사용액은 ${BRAND.creatorSharePct}:${BRAND.platformSharePct} 정산 구조의 기준이 됩니다.`,
  },
]

function formatWon(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

function formatInderium(value: number) {
  return `${value.toLocaleString('ko-KR')} 인더륨`
}

export default function StorePage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <PageBackLink href="/main" ariaLabel="허브로 돌아가기" showLabel />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Store</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/60">Coming Soon</p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">충전하기</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              작품 열람에 사용할 플랫폼 재화는 인더륨입니다. 현재 결제 기능은 준비 중이며, 충전 기준을 먼저 안내합니다.
            </p>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/70">Exchange Rate</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
              1 인더륨 = {formatWon(INDERIUM_UNIT_PRICE)}
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300 md:text-base">
              예를 들어 {formatWon(1000)}을 충전하면 지갑에 {formatInderium(10)}이 채워지는 구조로 준비하고 있습니다.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Status</p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">결제 연결 준비 중</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              지금은 충전 단위와 지갑 원장 구조를 먼저 보여주는 단계입니다. 실제 결제 요청과 잔액 반영은 이후 활성화됩니다.
            </p>
          </article>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">충전 단위 미리보기</h2>
              <p className="mt-1 text-sm text-zinc-400">금액을 선택하면 들어오는 인더륨 수량을 바로 이해할 수 있게 구성합니다.</p>
            </div>
            <p className="text-sm text-zinc-500">결제 비활성화</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {chargeOptions.map((option) => {
              const inderiumAmount = option.amount / INDERIUM_UNIT_PRICE

              return (
                <article key={option.amount} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-sm font-semibold text-zinc-300">{option.label}</p>
                  <h3 className="mt-3 text-3xl font-black text-white">{formatWon(option.amount)}</h3>
                  <p className="mt-2 text-lg font-bold text-amber-100">{formatInderium(inderiumAmount)}</p>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-400">{option.note}</p>
                  <button
                    type="button"
                    disabled
                    className="mt-5 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-500"
                  >
                    준비 중
                  </button>
                </article>
              )
            })}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">지갑 구조</h2>
            <p className="mt-1 text-sm text-zinc-400">인더륨은 사용 목적과 정산 기준에 맞춰 분리 관리될 예정입니다.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {walletNotes.map((note) => (
              <article key={note.title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <h3 className="text-lg font-bold text-white">{note.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{note.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
