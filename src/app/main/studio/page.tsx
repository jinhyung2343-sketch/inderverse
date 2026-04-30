import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { becomeCreator } from '@/app/main/studio/actions'
import type { Database } from '@/lib/supabase/types'

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

        {!canEnterCreatorTools ? (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[32px] border border-emerald-400/20 bg-emerald-500/5 p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Creator Access</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight">
                {profile?.display_name ?? '지금 계정'}을 작가 모드로 전환하기
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
                지금 계정은 아직 독자 권한이라 채널 작성, 스파크 발행, 정산 설정 화면이 잠겨 있습니다. 한 번 전환하면 바로 스튜디오 도구와
                스파크 편집 흐름으로 이어집니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <form action={becomeCreator}>
                  <button
                    type="submit"
                    className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    작가 권한 시작하기
                  </button>
                </form>
                <Link
                  href="/main/spark"
                  className="inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
                >
                  먼저 스파크 둘러보기
                </Link>
              </div>
            </article>

            <aside className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">전환 후 바로 열리는 것</p>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">스파크 생성 및 수정</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">채널 공개 상태 관리</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">정산 및 안전장치 구조 확인</div>
              </div>
            </aside>
          </section>
        ) : (
          <>
            <section className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Spark Launchpad</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">스파크 발행 흐름으로 바로 이동</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    스파크는 지금 가장 먼저 실제 발행 흐름이 닫혀 있는 포맷입니다. 커버 업로드와 공개 상태 전환까지 이어서 확인할 수 있습니다.
                  </p>
                </div>
                <Link
                  href="/main/studio/channels/spark/new"
                  className="inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  새 스파크 만들기
                </Link>
              </div>
            </section>

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
          </>
        )}
      </div>
    </main>
  )
}
