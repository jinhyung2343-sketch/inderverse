import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CreatorAgreementForm } from '@/components/studio/CreatorAgreementForm'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type UserRole = Database['public']['Enums']['user_role']

export default async function CreatorAgreementPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt?next=/main/studio/creator-agreement')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as UserRole | undefined

  if (role === 'creator' || role === 'admin') {
    redirect('/main/studio/channels')
  }

  const displayName =
    profile?.display_name?.trim() ||
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    '지금 계정'

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Creator Agreement</p>
            <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
              작가 등록은 창작 권리와 운영 책임이 함께 시작되는 단계입니다. 기본 동의를 확인한 뒤에만
              채널 생성과 정산 설정으로 이어집니다.
            </p>
          </div>

          <Link
            href="/main"
            className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            허브로 돌아가기
          </Link>
        </header>

        <CreatorAgreementForm displayName={displayName} />
      </div>
    </main>
  )
}
