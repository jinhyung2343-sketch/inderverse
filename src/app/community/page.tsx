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
    body: '글 작성, 의견 제출, 댓글 같은 참여 기능은 계정 기준 흐름에 맞춰 단계적으로 정리됩니다.',
  },
] as const

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-8 text-white selection:bg-white/30 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <PageBackLink href="/main" ariaLabel="허브로 돌아가기" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Community</p>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">커뮤니티</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              {BRAND.name}의 공지와 작품 소식을 확인하고, 서비스에 대한 의견을 남기는 공간입니다.
            </p>
          </div>
        </header>

        <div className="grid gap-7 lg:grid-cols-[1fr_0.95fr]">
          <section id="notices" className="space-y-5 scroll-mt-24">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">공지 · 알림</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  운영 공지와 플랫폼 소식을 구분해서 확인합니다.
                </p>
              </div>
              <p className="text-sm text-zinc-500">{noticeCards.length}개 항목</p>
            </div>

            <div className="grid gap-4">
              {noticeCards.map((card) => (
                <article
                  key={card.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:border-white/20 hover:bg-white/[0.09]"
                >
                  <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">
                    {card.badge}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{card.body}</p>
                </article>
              ))}
            </div>
          </section>

          <CommunityFeedbackPanel />
        </div>
      </div>
    </main>
  )
}
