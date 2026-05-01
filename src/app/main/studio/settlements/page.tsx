import { BRAND } from '@/lib/brand'
import { getCreatorWebtoonList } from '@/lib/server/webtoon-studio'
import { getPayoutMethodLabel, getWebtoonStatusLabel } from '@/lib/webtoon'

const settlementRules = [
  `작가 배분율은 채널별로 ${BRAND.defaultCreatorSharePct}%~${BRAND.maxCreatorSharePct}% 사이에서 직접 설정합니다.`,
  '정산 시점에는 배분율 스냅샷을 settlements 테이블에 저장해 이후 변경과 분리합니다.',
  '무료 코인 사용액과 유료 코인 사용액을 분리해 실제 정산 대상 매출을 구분합니다.',
]

export default async function StudioSettlementsPage() {
  const webtoons = await getCreatorWebtoonList()

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

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Revenue Settings</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">채널별 정산 설정</h2>
          </div>

          {webtoons.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {webtoons.map((webtoon) => (
                <div key={webtoon.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{webtoon.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {webtoon.category} · {getWebtoonStatusLabel(webtoon.status)} · 회차 {webtoon.episodeCount}개
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-zinc-300">
                      <p>작가 배분율: {webtoon.revenueSettings.creatorSharePct}%</p>
                      <p>최소 정산 금액: {webtoon.revenueSettings.minPayoutAmount.toLocaleString('ko-KR')}원</p>
                      <p>
                        정산 방식:{' '}
                        {webtoon.revenueSettings.payoutMethod
                          ? getPayoutMethodLabel(webtoon.revenueSettings.payoutMethod)
                          : '미정'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-sm leading-6 text-zinc-400">
              아직 만든 웹툰 채널이 없습니다. 웹툰 채널을 만들고 편집 화면에서 정산 기준을 저장하면 이곳에 반영됩니다.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
