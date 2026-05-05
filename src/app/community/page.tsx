import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import { CommunityFeedbackPanel } from '@/components/community/CommunityFeedbackPanel'

const noticeCards = [
  {
    id: 'launch',
    badge: '공지',
    title: '커뮤니티 허브 구조를 먼저 열었습니다',
    body: '지금은 공지·알림과 의견 남기기 흐름을 먼저 정리하고, 게시판과 댓글 기능은 그 다음 단계로 이어서 붙일 예정입니다.',
  },
  {
    id: 'notifications',
    badge: '알림',
    title: '향후 알림은 작품 소식과 플랫폼 공지를 분리합니다',
    body: '작품 업데이트 알림, 운영 공지, 이벤트 안내가 한데 섞이지 않도록 채널을 나눠 보여주는 방향으로 설계하고 있습니다.',
  },
  {
    id: 'feedback',
    badge: '의견',
    title: '초기 사용 의견을 먼저 수집합니다',
    body: '정식 게시판보다 먼저, 사용자들이 가장 답답했던 점과 원하는 기능을 빠르게 모아 커뮤니티 구조의 우선순위를 잡는 데 활용합니다.',
  },
] as const

export default function CommunityPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-cyan-500/10 blur-[100px]"></div>
      </div>

      <header className="z-20 flex items-center justify-between">
        <Link
          href="/main"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10"
          aria-label="뒤로 가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">Community</span>
      </header>

      <div className="z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 py-10">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">{BRAND.name}</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">커뮤니티 허브</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
            지금 단계에서는 공지와 알림을 먼저 모아 보고, 사용자 의견을 바로 남길 수 있는 최소 허브부터
            엽니다. 게시판과 상호작용 기능은 이 구조 위에 이어서 확장할 예정입니다.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <a
              href="#notices"
              className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6 transition hover:bg-cyan-500/15"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/70">Notice Feed</p>
              <h2 className="mt-3 text-2xl font-bold text-white">공지 · 알림</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                플랫폼 공지, 업데이트 예정 사항, 알림 정책을 먼저 정리해 보여줍니다.
              </p>
            </a>

            <a
              href="#feedback"
              className="rounded-3xl border border-white/10 bg-black/20 p-6 transition hover:bg-white/10"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Feedback Desk</p>
              <h2 className="mt-3 text-2xl font-bold text-white">의견 남기기</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                불편했던 점, 커뮤니티 아이디어, 원하는 알림 구조를 바로 초안으로 남길 수 있습니다.
              </p>
            </a>
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
              작품 알림과 운영 공지를 나눠 설계하기 전 단계로, 커뮤니티 관련 핵심 소식부터 한 화면에
              정리합니다.
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
