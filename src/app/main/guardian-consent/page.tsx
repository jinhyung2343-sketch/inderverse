import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function GuardianConsentPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt?next=/main/guardian-consent')
  }

  const [{ data: profile }, { data: guardianConsent }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, guardian_consent_status, guardian_consent_requested_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('minor_guardian_consents')
      .select(
        'guardian_name, guardian_email, guardian_phone, guardian_relationship, requested_at, status, verification_channel'
      )
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (profile?.guardian_consent_status !== 'pending') {
    redirect('/main')
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Guardian Consent</p>
          <h1 className="text-4xl font-black tracking-tight">보호자 동의 확인 대기</h1>
          <p className="text-zinc-400">
            {profile?.display_name ?? '지금 계정'} 계정은 만 14세 미만 가입으로 접수되어 보호자 동의 확인을
            기다리고 있습니다. 확인이 끝나기 전까지는 결제와 작가 등록 기능이 잠시 제한됩니다.
          </p>
        </header>

        <section className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6">
          <div className="grid gap-4 text-sm leading-6 text-zinc-200">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">현재 상태</p>
              <p className="mt-2 text-lg font-semibold text-white">보호자 동의 확인 대기</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p>보호자 이름: {guardianConsent?.guardian_name ?? '미입력'}</p>
              <p>보호자 이메일: {guardianConsent?.guardian_email ?? '미입력'}</p>
              <p>보호자 연락처: {guardianConsent?.guardian_phone ?? '미입력'}</p>
              <p>관계: {guardianConsent?.guardian_relationship ?? '미입력'}</p>
              <p>예정 확인 채널: {guardianConsent?.verification_channel === 'phone' ? '휴대폰 확인' : '이메일 확인'}</p>
              <p>
                접수 시각:{' '}
                {guardianConsent?.requested_at ??
                  profile?.guardian_consent_requested_at ??
                  '접수 정보 확인 중'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
          <div className="grid gap-3 text-sm leading-6 text-zinc-300">
            <p>가능한 일: 메인 허브, 작품 탐색, 스파크 둘러보기, 기본 계정 유지</p>
            <p>잠시 제한되는 일: 코인 충전 및 결제, 작가 등록 및 스튜디오 진입</p>
            <p>다음 단계: 운영 측에서 보호자 동의 확인 절차를 검토한 뒤 상태를 갱신합니다.</p>
            <p>향후 완성본에서는 PASS 또는 통신사 본인인증 흐름이 이 연락처를 기준으로 연결될 수 있습니다.</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/main"
              className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              메인으로 이동
            </Link>
            <Link
              href="/main/explore"
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              작품 탐색하기
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
