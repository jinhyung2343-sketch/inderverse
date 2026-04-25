import Link from 'next/link'

const studioSections = [
  {
    href: '/main/studio/channels',
    title: '채널 설계',
    description: '작품, 태그, 성인 구분, 연재 주기, 에피소드 가격을 작가가 직접 제어합니다.',
  },
  {
    href: '/main/studio/settlements',
    title: '정산 구조',
    description: '채널별 수익 배분율, 정산 스냅샷, 지급 기준 금액을 운영 가능한 형태로 관리합니다.',
  },
  {
    href: '/main/studio/safety',
    title: '성인 인증 및 안전장치',
    description: '표현의 자유를 넓히되 연령 게이트, 경고 태그, 인증 이력을 분리 관리합니다.',
  },
]

export default function StudioPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio</p>
          <h1 className="text-4xl font-black tracking-tight">작가 스튜디오</h1>
          <p className="max-w-3xl text-zinc-400">
            inderverse는 작가가 플랫폼 규칙에 맞춰 끼워 넣는 구조가 아니라, 작가가 채널과 수익 모델을 먼저 정의하고 플랫폼이 이를 뒷받침하는 구조를 지향합니다.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {studioSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/7"
            >
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{section.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
