import Link from 'next/link'

const flowSteps = [
  {
    href: '/',
    title: '1. 첫 화면',
    description: '로고와 시작하기 버튼만 있는 랜딩 화면',
  },
  {
    href: '/join-prompt',
    title: '2. 가입 여부 확인',
    description: '회원가입 또는 게스트 진입을 고르는 화면',
  },
  {
    href: '/auth/sign-up',
    title: '3. 회원가입 화면',
    description: '실제 Supabase 회원가입 폼',
  },
  {
    href: '/main',
    title: '4. 메인 허브',
    description: '주요 메뉴가 배치된 메인 페이지',
  },
]

export default function FlowPreviewPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Flow Preview</p>
          <h1 className="text-4xl font-black tracking-tight">화면 전환 상태 확인</h1>
          <p className="max-w-2xl text-zinc-400">
            현재 온보딩 흐름을 단계별로 바로 열어볼 수 있는 확인용 주소입니다. 실제 기능 페이지를 건드리지 않고 전환 상태만 빠르게 점검할 때 쓰면 됩니다.
          </p>
        </header>

        <section className="grid gap-4">
          {flowSteps.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/8"
            >
              <h2 className="text-2xl font-bold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{step.description}</p>
              <p className="mt-4 text-xs tracking-[0.2em] text-zinc-500">{step.href}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
