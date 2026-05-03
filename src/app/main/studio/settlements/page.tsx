import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import { getSettlementStatusLabel } from '@/lib/settlement'
import { getCreatorSettlementDashboard } from '@/lib/server/settlements'
import { getCreatorWebtoonList } from '@/lib/server/webtoon-studio'
import { getPayoutMethodLabel, getWebtoonStatusLabel } from '@/lib/webtoon'

const settlementRules = [
  `인더버스의 일반 정산 분배는 작가 ${BRAND.creatorSharePct}% / 회사 ${BRAND.platformSharePct}%로 고정됩니다.`,
  '정산 스냅샷에는 당시 배분 비율과 집계 결과를 함께 저장해 이후 정책 변경과 분리합니다.',
  '무료 코인 사용액과 유료 코인 사용액을 분리해 실제 정산 기준 매출을 구분합니다.',
]

function formatCoins(value: number) {
  return `${value.toLocaleString('ko-KR')}코인`
}

function formatPeriodRange(startDate: string, endDate: string) {
  return `${startDate} ~ ${endDate}`
}

export default async function StudioSettlementsPage() {
  const [webtoons, dashboard] = await Promise.all([
    getCreatorWebtoonList(),
    getCreatorSettlementDashboard(),
  ])

  const totals = dashboard.currentPeriod.totals

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Settlements</p>
            <h1 className="text-4xl font-black tracking-tight">정산 구조</h1>
            <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
              현재 화면은 {dashboard.currentPeriod.label} 구매 데이터를 기준으로 정산 미리보기를 보여줍니다. 지금 단계에서는 유료 코인 사용액을 기준 매출로 보고,
              그 안에서 작가 {BRAND.creatorSharePct}% / 회사 {BRAND.platformSharePct}%를 계산합니다.
            </p>
          </div>

          <Link
            href="/main"
            className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            허브로 돌아가기
          </Link>
        </header>

        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6">
          <ul className="space-y-3 text-sm leading-6 text-zinc-300">
            {settlementRules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-sky-400/20 bg-sky-500/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Current Preview</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">{dashboard.currentPeriod.label} 정산 미리보기</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                집계 기간: {formatPeriodRange(dashboard.currentPeriod.startDate, dashboard.currentPeriod.endDateExclusive)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
              일반 정산 비율 {BRAND.creatorSharePct}:{BRAND.platformSharePct}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Purchases</p>
              <p className="mt-3 text-3xl font-black text-white">{totals.totalPurchases.toLocaleString('ko-KR')}</p>
              <p className="mt-2 text-sm text-zinc-400">이번 달 구매 건수</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Paid Revenue</p>
              <p className="mt-3 text-3xl font-black text-white">{formatCoins(totals.paidCoinRevenue)}</p>
              <p className="mt-2 text-sm text-zinc-400">정산 기준 유료 코인 매출</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Creator</p>
              <p className="mt-3 text-3xl font-black text-white">{formatCoins(totals.creatorAmount)}</p>
              <p className="mt-2 text-sm text-zinc-400">작가 몫 예상 금액</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Platform</p>
              <p className="mt-3 text-3xl font-black text-white">{formatCoins(totals.platformAmount)}</p>
              <p className="mt-2 text-sm text-zinc-400">플랫폼 몫 예상 금액</p>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm leading-6 text-zinc-300">
            총 사용 코인 {formatCoins(totals.grossRevenueCoins)} 중 무료 코인 {formatCoins(totals.freeCoinRevenue)}는 별도로 추적됩니다.
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Channel Preview</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">채널별 이번 달 정산 미리보기</h2>
          </div>

          {dashboard.channelSummaries.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {dashboard.channelSummaries.map((channel) => (
                <div key={channel.channelId} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{channel.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        상태 {getWebtoonStatusLabel(channel.status)} · 구매 {channel.totalPurchases.toLocaleString('ko-KR')}건
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-zinc-300">
                      <p>유료 코인 매출: {formatCoins(channel.paidCoinRevenue)}</p>
                      <p>무료 코인 사용: {formatCoins(channel.freeCoinRevenue)}</p>
                      <p>작가 몫: {formatCoins(channel.creatorAmount)}</p>
                      <p>플랫폼 몫: {formatCoins(channel.platformAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-sm leading-6 text-zinc-400">
              이번 달 집계 대상 구매가 아직 없습니다. 유료 회차 구매가 생기면 채널별 정산 미리보기가 이곳에 나타납니다.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Settlement Snapshots</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">저장된 정산 스냅샷</h2>
          </div>

          {dashboard.recentSnapshots.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {dashboard.recentSnapshots.map((snapshot) => (
                <div key={snapshot.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{snapshot.channelTitle}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        기간 {formatPeriodRange(snapshot.periodStart, snapshot.periodEnd)} · 상태 {getSettlementStatusLabel(snapshot.status)}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-zinc-300">
                      <p>배분 비율 스냅샷: 작가 {snapshot.creatorSharePctSnapshot}% / 회사 {100 - snapshot.creatorSharePctSnapshot}%</p>
                      <p>유료 코인 매출: {formatCoins(snapshot.paidCoinRevenue)}</p>
                      <p>작가 몫: {formatCoins(snapshot.creatorAmount)}</p>
                      <p>플랫폼 몫: {formatCoins(snapshot.platformAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-sm leading-6 text-zinc-400">
              아직 확정 저장된 정산 스냅샷이 없습니다. 이후 월별 정산 생성 작업을 붙이면 이곳에서 이력으로 확인할 수 있습니다.
            </div>
          )}
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
                      <p>정산 분배: 작가 {webtoon.revenueSettings.creatorSharePct}% / 회사 {100 - webtoon.revenueSettings.creatorSharePct}%</p>
                      <p>최소 정산 금액: {webtoon.revenueSettings.minPayoutAmount.toLocaleString('ko-KR')}원</p>
                      <p>
                        정산 방식:{' '}
                        {webtoon.revenueSettings.payoutMethod
                          ? getPayoutMethodLabel(webtoon.revenueSettings.payoutMethod)
                          : '미정'}
                      </p>
                      <p>
                        정산 계좌:{' '}
                        {webtoon.revenueSettings.maskedBankSummary
                          ? webtoon.revenueSettings.maskedBankSummary
                          : webtoon.revenueSettings.hasStoredBankInfo
                            ? '암호화 저장됨'
                            : '미입력'}
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
