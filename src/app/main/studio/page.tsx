import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCreatorSparkList } from '@/lib/server/spark'
import { getCreatorWebtoonList } from '@/lib/server/webtoon-studio'
import type { Database } from '@/lib/supabase/types'

const studioSections = [
  {
    href: '/main/studio/settlements',
    title: '정산 구조',
    description: '고정 70:30 정산 기준, 정산 스냅샷, 지급 기준 금액을 운영 가능한 형태로 관리합니다.',
  },
  {
    href: '/main/studio/safety',
    title: '성인 인증 및 안전장치',
    description: '표현의 자유를 넓히되 연령 게이트, 경고 태그, 인증 이력을 분리 관리합니다.',
  },
]

type UserRole = Database['public']['Enums']['user_role']

export default async function StudioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', user.id)
        .single()
    : { data: null }

  const role = profile?.role as UserRole | undefined
  const canEnterCreatorTools = role === 'creator' || role === 'admin'
  const [webtoonChannels, sparkChannels] = canEnterCreatorTools
    ? await Promise.all([getCreatorWebtoonList(), getCreatorSparkList()])
    : [[], []]

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio</p>
            <h1 className="text-4xl font-black tracking-tight">작가 스튜디오</h1>
            <p className="max-w-3xl text-zinc-400">
              inderverse는 작가가 플랫폼 규칙에 맞춰 끼워 넣는 구조가 아니라, 작가가 채널과 수익 모델을 먼저 정의하고 플랫폼이 이를 뒷받침하는 구조를 지향합니다.
            </p>
          </div>

          <Link
            href="/main"
            className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            허브로 돌아가기
          </Link>
        </header>

        {!canEnterCreatorTools ? (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[32px] border border-emerald-400/20 bg-emerald-500/5 p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Creator Access</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight">
                {profile?.display_name ?? '지금 계정'}을 작가 모드로 전환하기
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
                지금 계정은 아직 독자 권한이라 채널 작성, 스파크 발행, 정산 설정 화면이 잠겨 있습니다. 작가 등록 전에는 기본 동의서를 확인하고,
                게시와 정산에 필요한 운영 원칙에 동의한 뒤에 스튜디오 도구로 이어지게 됩니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/main/studio/creator-agreement"
                  className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  작가 등록 시작하기
                </Link>
                <Link
                  href="/main/spark"
                  className="inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
                >
                  먼저 스파크 둘러보기
                </Link>
              </div>
            </article>

            <aside className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">등록 전에 확인하는 것</p>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">작가 등록 및 작품 게시 기본 동의서</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">저작권과 2차 사업 기본 원칙</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">수익배분 및 정산 기준</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">연재 운영과 플랫폼 질서 관련 책임</div>
              </div>
            </aside>
          </section>
        ) : (
          <>
            <section className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Channel Menu</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white">작품 관리는 채널 메뉴에서 시작합니다</h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-300 md:text-base">
                    웹툰 만들기, 스파크 만들기, 채널 수정, 회차 관리까지 한 흐름으로 이어지도록 정리했습니다. 먼저 채널 메뉴로 들어가면 지금 만든 작품과 다음 작업을 한눈에 볼 수 있습니다.
                  </p>
                </div>
                <Link
                  href="/main/studio/channels"
                  className="inline-flex w-fit rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  채널 메뉴 열기
                </Link>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Webtoon</p>
                  <p className="mt-3 text-3xl font-black text-white">{webtoonChannels.length}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">관리 중인 웹툰 채널 수</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Spark</p>
                  <p className="mt-3 text-3xl font-black text-white">{sparkChannels.length}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">관리 중인 스파크 채널 수</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Flow</p>
                  <p className="mt-3 text-lg font-bold text-white">스튜디오 홈 → 채널 메뉴 → 만들기/수정</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">새 작품 생성도 채널 메뉴 안에서 이어지도록 흐름을 맞췄습니다.</p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
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
          </>
        )}
      </div>
    </main>
  )
}
