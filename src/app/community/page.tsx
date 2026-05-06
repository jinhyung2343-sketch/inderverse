import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'
import { CommunityFeedbackPanel } from '@/components/community/CommunityFeedbackPanel'

const noticeCards = [
  {
    id: 'operations',
    badge: '공지',
    title: '커뮤니티 운영 공지',
    body: '서비스 이용 기준, 점검 안내, 커뮤니티 운영 원칙을 한곳에서 확인할 수 있습니다.',
  },
  {
    id: 'updates',
    badge: '알림',
    title: '작품과 플랫폼 소식',
    body: '작품 업데이트, 플랫폼 변경 사항, 이벤트 안내를 구분해서 살펴볼 수 있습니다.',
  },
  {
    id: 'participation',
    badge: '참여',
    title: '참여 기능 안내',
    body: '글 작성, 의견 제출, 댓글 같은 참여 기능은 계정 기준으로 기록되며 로그인 후 사용할 수 있습니다.',
  },
] as const

const hubMenus = [
  {
    href: '#notices',
    label: 'Notice Feed',
    title: '공지 · 알림',
    body: '운영 공지와 작품 소식을 읽고 현재 플랫폼 흐름을 확인합니다.',
    className: 'border-cyan-400/20 bg-cyan-500/10 hover:bg-cyan-500/15',
  },
  {
    href: '#feedback',
    label: 'Feedback',
    title: '의견 남기기',
    body: '게스트는 안내를 볼 수 있고, 로그인 후 의견 작성에 참여할 수 있습니다.',
    className: 'border-white/10 bg-black/20 hover:bg-white/10',
  },
  {
    href: '/main/spark',
    label: 'Spark',
    title: '스파크 보기',
    body: '커뮤니티에서 다루는 짧은 만평 흐름을 바로 둘러봅니다.',
    className: 'border-sky-400/20 bg-sky-500/10 hover:bg-sky-500/15',
  },
] as const

export default function CommunityPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#050505] px-6 pb-8 text-white selection:bg-white/30">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-cyan-500/10 blur-[100px]"></div>
      </div>

      <header className="sticky top-0 z-40 -mx-6 flex items-center justify-between border-b border-white/10 bg-[#050505]/85 px-6 py-4 backdrop-blur-xl">
        <PageBackLink href="/main" ariaLabel="허브로 돌아가기" />
        <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">Community</span>
      </header>

      <div className="z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 py-6">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">{BRAND.name}</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">커뮤니티 허브</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
            공지, 작품 소식, 참여 안내를 한곳에서 확인하는 공간입니다. 게스트는 커뮤니티 흐름을 둘러볼 수 있고,
            글 작성과 의견 제출은 로그인 후 사용할 수 있습니다.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {hubMenus.map((menu) => (
              <a
                key={menu.href}
                href={menu.href}
                className={`rounded-3xl border p-6 transition ${menu.className}`}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{menu.label}</p>
                <h2 className="mt-3 text-2xl font-bold text-white">{menu.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{menu.body}</p>
              </a>
            ))}
          </div>
        </section>

        <section
          id="notices"
          className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl scroll-mt-24"
        >
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Notice Feed</p>
            <h2 className="text-2xl font-bold text-white">공지 · 알림</h2>
            <p className="max-w-2xl text-sm leading-6 text-zinc-400">
              운영 공지, 작품 소식, 참여 안내를 분리해 확인할 수 있습니다.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {noticeCards.map((card) => (
              <article
                key={card.id}
                className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/10"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                    {card.badge}
                  </span>
                  <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <CommunityFeedbackPanel />
      </div>
    </main>
  )
}
