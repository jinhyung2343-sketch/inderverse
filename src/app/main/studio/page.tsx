import Link from 'next/link'
import { LoginRequiredAction } from '@/components/auth/LoginRequiredAction'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { createClient } from '@/lib/supabase/server'
import { getCreatorNovelList } from '@/lib/server/novel-studio'
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

const registrationChecklist = [
  '작가 등록 및 작품 게시 기본 동의',
  '저작권과 2차 사업 기본 원칙 확인',
  '수익배분 및 정산 기준 동의',
  '연재 운영과 플랫폼 책임 확인',
]

type UserRole = Database['public']['Enums']['user_role']

export default async function StudioPage() {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authError ? null : authData.user

  if (authError) {
    console.warn('Unable to read viewer session for studio:', authError)
  }

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', user.id)
        .single()
        .then((result) => {
          if (result.error) {
            console.warn('Unable to load studio profile:', result.error)
            return { data: null }
          }

          return { data: result.data }
        })
    : { data: null }

  const role = profile?.role as UserRole | undefined
  const canEnterCreatorTools = role === 'creator' || role === 'admin'
  const [webtoonChannels, novelChannels, sparkChannels] = canEnterCreatorTools
    ? await Promise.all([getCreatorWebtoonList(), getCreatorNovelList(), getCreatorSparkList()])
    : [[], [], []]
  const creatorName = profile?.display_name ?? '지금 계정'
  const totalChannels = webtoonChannels.length + novelChannels.length + sparkChannels.length
  const comicWorksCount = webtoonChannels.length + sparkChannels.length

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <PageBackLink href="/main" ariaLabel="허브로 돌아가기" showLabel />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Studio</p>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">작가 스튜디오</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              작품 만들기, 공개 관리, 정산과 안전 설정을 한곳에서 시작합니다.
            </p>
          </div>
        </header>

        {!canEnterCreatorTools ? (
          <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <article className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Creator Access</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight">{creatorName}을 작가 모드로 전환하기</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
                작가 등록을 완료하면 웹툰 계열, 웹소설 발행과 정산 설정 메뉴를 사용할 수 있습니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {user ? (
                  <Link
                    href="/main/studio/creator-agreement"
                    className="inline-flex min-h-11 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    작가 등록 시작하기
                  </Link>
                ) : (
                  <LoginRequiredAction nextPath="/main/studio/creator-agreement">
                    작가 등록 시작하기
                  </LoginRequiredAction>
                )}
                <Link
                  href="/main/spark"
                  className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.06] px-6 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
                >
                  먼저 짧은 만화 둘러보기
                </Link>
              </div>
            </article>

            <aside className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">등록 전 확인</p>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-zinc-300">
                {registrationChecklist.map((item) => (
                  <li key={item} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </section>
        ) : (
          <section className="space-y-7">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/main/studio/creator-channel"
                className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 transition hover:border-emerald-300/40 hover:bg-emerald-500/15 md:col-span-2"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100/70">Creator Home</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">내 작가 채널</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  작가명, 소개, 대표 이미지, 외부 링크를 정리하고 모든 작품의 상위 홈을 관리합니다.
                </p>
              </Link>

              <Link
                href="/main/studio/channels"
                className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-6 transition hover:border-sky-300/40 hover:bg-sky-500/15 md:col-span-2"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100/70">Start Here</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">내 작품 관리</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  웹툰 계열과 웹소설을 한곳에서 만들고 형식에 맞는 편집기로 이어갑니다.
                </p>
              </Link>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Total</p>
                <p className="mt-3 text-4xl font-black text-white">{totalChannels}</p>
                <p className="mt-2 text-sm text-zinc-400">관리 중인 작품</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Works</p>
                <p className="mt-3 text-lg font-bold text-white">
                  웹툰 계열 {comicWorksCount} · 웹소설 {novelChannels.length}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  연재 웹툰 {webtoonChannels.length} · 스파크 {sparkChannels.length}
                </p>
              </div>
            </div>

            <section className="space-y-4">
              <div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">운영 메뉴</h2>
                  <p className="mt-1 text-sm text-zinc-400">정산과 안전 설정은 필요할 때 바로 들어갈 수 있게 분리했습니다.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {studioSections.map((section) => (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 transition hover:border-white/20 hover:bg-white/[0.09]"
                  >
                    <h3 className="text-xl font-bold">{section.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{section.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          </section>
        )}
      </div>
    </main>
  )
}
