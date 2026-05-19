import { redirect } from 'next/navigation'
import { PageBackLink } from '@/components/navigation/PageBackLink'
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
    redirect('/main/studio')
  }

  const displayName =
    profile?.display_name?.trim() ||
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    '지금 계정'

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageBackLink href="/main" ariaLabel="허브로 돌아가기" />

        <header>
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Bottega / Creator Agreement</p>
            <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
              작가 등록은 Bottega를 여는 첫 단계입니다. 기본 동의를 확인하면 개인 공방인 My Bottega가 생성되고,
              장르를 고르는 즉시 그에 맞는 작업실로 이어집니다.
            </p>
          </div>
        </header>

        <CreatorAgreementForm displayName={displayName} />
      </div>
    </main>
  )
}
