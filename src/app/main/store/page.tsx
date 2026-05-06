import { PageBackLink } from '@/components/navigation/PageBackLink'
import { LoginRequiredAction } from '@/components/auth/LoginRequiredAction'
import { BRAND } from '@/lib/brand'
import { createClient } from '@/lib/supabase/server'

const checkpoints = [
  '코인 충전은 로그인한 계정과 서버 검증을 거친 결제 요청에만 연결됩니다.',
  '유료 코인과 무료 코인을 분리 관리해 정산 기준을 명확히 유지합니다.',
  `작가와 회사의 기본 정산 분배는 ${BRAND.creatorSharePct}:${BRAND.platformSharePct}로 고정됩니다.`,
]

const storeSections = [
  {
    title: '충전 상태',
    description: '결제 요청, 승인 대기, 충전 완료 흐름을 계정 기준으로 확인하는 영역입니다.',
  },
  {
    title: '지갑 원장',
    description: '유료 코인과 무료 코인의 적립, 사용, 환불 기록을 분리해 보여주는 영역입니다.',
  },
  {
    title: '정산 기준',
    description: '작품 구매와 회차 열람이 작가 정산으로 이어지는 기준을 확인하는 영역입니다.',
  },
]

export default async function StorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isGuest = !user

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 pb-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col">
        <header className="sticky top-0 z-40 -mx-6 flex items-center justify-between border-b border-white/10 bg-[#050505]/90 px-6 py-4 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl">
          <PageBackLink href="/main" ariaLabel="허브로 돌아가기" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Store</span>
        </header>

        <div className="grid gap-6 py-6">
          <section className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Store</p>
            <h1 className="text-4xl font-black tracking-tight">코인 및 결제 구조</h1>
            <p className="text-zinc-400">
              충전, 지갑 원장, 작품 구매와 정산 기준을 한 화면에서 확인하는 결제 허브입니다.
            </p>
          </section>

          {isGuest ? (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-zinc-300 backdrop-blur">
              <p className="font-semibold text-white">게스트 모드에서는 충전 구조를 둘러볼 수 있습니다.</p>
              <p className="mt-2">
                실제 충전, 지갑 기록, 구매 이력은 로그인한 계정에만 연결됩니다. 버튼을 누르면 로그인 필요 안내가 표시됩니다.
              </p>
            </section>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-3">
            {storeSections.map((section) => (
              <article key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-base font-bold text-white">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{section.description}</p>
              </article>
            ))}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Charge</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">충전하기</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              게스트 모드에서는 결제 구조를 확인할 수 있고, 실제 충전과 지갑 기록은 로그인한 계정에만 연결됩니다.
            </p>
            <div className="mt-5">
              {isGuest ? (
                <LoginRequiredAction
                  nextPath="/main/store"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 sm:w-fit"
                >
                  충전 시작하기
                </LoginRequiredAction>
              ) : (
                <button
                  type="button"
                  className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-6 py-3 text-sm font-semibold text-zinc-300 sm:w-fit"
                  disabled
                >
                  충전 기능 준비 중
                </button>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-amber-400/20 bg-amber-500/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Policy</p>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-white">운영 기준</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
              {checkpoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
