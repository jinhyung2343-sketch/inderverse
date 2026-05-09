import Link from 'next/link'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { CreatorChannelSettingsForm } from '@/components/studio/CreatorChannelSettingsForm'
import { ensureDefaultCreatorChannel } from '@/lib/server/creator-channels'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type UserRole = Database['public']['Enums']['user_role']

export default async function CreatorChannelSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <PageBackLink href="/main/studio" ariaLabel="스튜디오 홈으로 돌아가기" />
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-8">
            <h1 className="text-3xl font-black tracking-tight">로그인이 필요합니다</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-400">작가 채널을 관리하려면 먼저 로그인해 주세요.</p>
            <Link
              href="/join-prompt?next=/main/studio/creator-channel"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              로그인하고 계속하기
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as UserRole | undefined
  const canManageCreatorChannel = role === 'creator' || role === 'admin'

  if (!canManageCreatorChannel) {
    return (
      <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <PageBackLink href="/main/studio" ariaLabel="스튜디오 홈으로 돌아가기" />
          <section className="rounded-[32px] border border-emerald-400/20 bg-emerald-500/5 p-6 md:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Creator Access</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">작가 등록 후 채널을 만들 수 있습니다</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              작가 채널은 작품을 담는 공개 홈입니다. 작가 등록을 완료하면 바로 채널 설정을 시작할 수 있습니다.
            </p>
            <Link
              href="/main/studio/creator-agreement"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              작가 등록 시작하기
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const channel = await ensureDefaultCreatorChannel(user.id)

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <PageBackLink href="/main/studio" ariaLabel="스튜디오 홈으로 돌아가기" showLabel />
          <Link
            href="/main/studio/channels"
            className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            내 작품으로
          </Link>
        </header>

        <CreatorChannelSettingsForm channel={channel} />
      </div>
    </main>
  )
}
