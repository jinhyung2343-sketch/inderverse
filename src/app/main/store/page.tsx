import { HybridBillingPanel } from '@/components/store/HybridBillingPanel'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'
import { formatWon } from '@/lib/billing'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function StorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [profileResult, walletResult] = user
    ? await Promise.all([
        supabase
          .from('profiles')
          .select('is_subscribed')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('coin_wallets')
          .select('paid_balance, free_balance')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])
    : [
        { data: null },
        { data: null },
      ]
  const isSubscribed = Boolean(profileResult.data?.is_subscribed)
  const paidBalance = walletResult.data?.paid_balance ?? 0
  const freeBalance = walletResult.data?.free_balance ?? 0

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <PageBackLink href="/main" ariaLabel="허브로 돌아가기" showLabel />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Billing</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100/70">Hybrid Access</p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">구독과 인더륨</h1>
            <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
              인더버스의 기본 열람은 월 {formatWon(7900)} 구독으로 열고, 개별 소장과 작가 후원은 인더륨으로 분리합니다.
              로컬 테스트에서는 실제 PG 결제 없이 구독 상태와 인더륨 장부만 확인합니다.
            </p>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100/70">Default</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
              기본은 구독, 추가 선택은 인더륨
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300 md:text-base">
              맛보기 회차는 무료로 열고, 이후 구독 공개 회차는 구독자에게 열립니다. 독자가 특정 회차를 소장하거나
              작가에게 직접 후원하고 싶을 때만 인더륨을 사용합니다.
            </p>
          </article>

          <article className="rounded-lg border border-white/10 bg-white/[0.06] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Settlement</p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">정산 흐름 분리</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              구독 수익 풀과 인더륨 개별 매출을 별도 장부로 남길 수 있게 구조를 나눕니다. 인더륨 유료 사용액은
              기존 {BRAND.creatorSharePct}:{BRAND.platformSharePct} 정산 기준에 계속 연결됩니다.
            </p>
          </article>
        </section>

        <HybridBillingPanel
          isLoggedIn={Boolean(user)}
          isSubscribed={isSubscribed}
          paidBalance={paidBalance}
          freeBalance={freeBalance}
        />
      </div>
    </main>
  )
}
