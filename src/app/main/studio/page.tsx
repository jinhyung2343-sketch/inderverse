import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginRequiredAction } from '@/components/auth/LoginRequiredAction'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getBottegaHref } from '@/lib/bottega'
import { ensureDefaultCreatorChannel } from '@/lib/server/creator-channels'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

const registrationChecklist = [
  '작가 등록 및 Bottega 개설 동의',
  '저작권과 2차 사업 기본 원칙 확인',
  '수익배분 및 정산 기준 동의',
  '장르별 작업실 운영 기준 확인',
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
  let creatorChannelError: string | null = null
  let creatorChannelPath: string | null = null

  if (canEnterCreatorTools && user) {
    try {
      const channel = await ensureDefaultCreatorChannel(user.id)
      creatorChannelPath = getBottegaHref(channel.primaryWorkType)
    } catch (error) {
      console.warn('Unable to ensure default creator channel:', error)
      creatorChannelError = 'Bottega를 여는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    }
  }

  if (creatorChannelPath) {
    redirect(creatorChannelPath)
  }

  const creatorName = profile?.display_name ?? '지금 계정'

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <PageBackLink href="/main" ariaLabel="허브로 돌아가기" showLabel />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Bottega</p>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">Bottega 열기</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              르네상스 공방처럼, 작가 등록 후 장르에 맞는 개인 작업실을 열고 창작과 공개를 한곳에서 시작합니다.
            </p>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Open Bottega</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight">{creatorName}의 Bottega 열기</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
              작가 등록을 완료하면 개인 공방인 My Bottega가 생성됩니다. 이후 툰, 소설, 음악처럼 장르를 고르면
              그 장르에 맞는 작업대와 대시보드로 바로 이어집니다.
            </p>
            {creatorChannelError ? (
              <p className="mt-4 rounded-lg border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
                {creatorChannelError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {user ? (
                <Link
                  href="/main/studio/creator-agreement"
                  className="inline-flex min-h-11 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Bottega 열기
                </Link>
              ) : (
                <LoginRequiredAction nextPath="/main/studio/creator-agreement">
                  Bottega 열기
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
      </div>
    </main>
  )
}
