'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PolicyViewerModal } from '@/components/auth/PolicyViewerModal'
import { BRAND } from '@/lib/brand'
import { createClient } from '@/lib/supabase/client'
import {
  buildGuardianProfileMetadata,
  buildMinorGuardianConsentRecord,
  storePendingMinorGuardianConsent,
  type MinorGuardianConsentFields,
} from '@/lib/minor-guardian-consent'
import {
  buildUserTermsConsentMetadata,
  buildUserTermsConsentRecord,
  getInitialSignUpConsentValues,
  hasAcceptedAllRequiredSignUpConsents,
  storePendingUserTermsConsent,
  USER_TERMS_CONSENT_CONFLICT_KEY,
  type SignUpConsentValues,
} from '@/lib/user-consent-log'
import {
  AGE_ADULT_CONSENT_LABEL,
  AGE_GUARDIAN_CONSENT_LABEL,
  optionalSignUpConsentItems,
  requiredSignUpConsentItems,
  userPolicyDocuments,
  type PolicyDocument,
  type SignUpConsentKey,
} from '@/lib/user-terms'

type AgeConsentMode = 'adult' | 'guardian' | null

function ConsentRow({
  checked,
  label,
  onToggle,
  onView,
}: {
  checked: boolean
  label: string
  onToggle: () => void
  onView: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-zinc-200">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
        />
        <span>{label}</span>
      </label>

      <button
        type="button"
        onClick={onView}
        className="inline-flex shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10"
      >
        보기
      </button>
    </div>
  )
}

function AgeConsentRow({
  checked,
  description,
  label,
  onSelect,
}: {
  checked: boolean
  description: string
  label: string
  onSelect: () => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-200">
      <input
        type="radio"
        checked={checked}
        onChange={onSelect}
        className="mt-1 h-4 w-4 border-white/20 bg-black/30"
        name="age-consent"
      />
      <span>
        {label}
        <span className="mt-1 block text-xs leading-5 text-zinc-500">{description}</span>
      </span>
    </label>
  )
}

export function SignUpPageClient({
  nextPath,
}: {
  nextPath: string | null
}) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consents, setConsents] = useState<SignUpConsentValues>(getInitialSignUpConsentValues)
  const [ageConsentMode, setAgeConsentMode] = useState<AgeConsentMode>(null)
  const [guardianFields, setGuardianFields] = useState<MinorGuardianConsentFields>({
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    guardianRelationship: '',
  })
  const [viewerDocument, setViewerDocument] = useState<PolicyDocument | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectPath =
    nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/main'
  const backHref = nextPath ? `/join-prompt?next=${encodeURIComponent(nextPath)}` : '/join-prompt'

  const allRequiredAgreed = hasAcceptedAllRequiredSignUpConsents(consents)
  const allConsentsChecked = [...requiredSignUpConsentItems, ...optionalSignUpConsentItems].every(
    (item) => consents[item.key]
  )
  const guardianFieldsCompleted =
    guardianFields.guardianName.trim().length > 0 &&
    guardianFields.guardianEmail.trim().length > 0 &&
    guardianFields.guardianPhone.trim().length > 0 &&
    guardianFields.guardianRelationship.trim().length > 0
  const requiresGuardianDetails = ageConsentMode === 'guardian'
  const submitDisabled =
    isSubmitting || !allRequiredAgreed || (requiresGuardianDetails && !guardianFieldsCompleted)
  const requiredConsentItemsExcludingAge = requiredSignUpConsentItems.filter(
    (item) => item.key !== 'ageConfirmed'
  )
  const agePolicyDocumentId =
    requiredSignUpConsentItems.find((item) => item.key === 'ageConfirmed')?.documentId ?? 'age_confirmation'

  const toggleConsent = (key: SignUpConsentKey) => {
    setConsents((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const toggleAllConsents = () => {
    const nextValue = !allConsentsChecked

    setAgeConsentMode(nextValue ? (ageConsentMode ?? 'adult') : null)
    setConsents({
      requiredTermsAgreed: nextValue,
      privacyAgreed: nextValue,
      ageConfirmed: nextValue,
      paymentPolicyAgreed: nextValue,
      communityPolicyAgreed: nextValue,
      marketingAgreed: nextValue,
      recommendationDataAgreed: nextValue,
      emailNotificationAgreed: nextValue,
      pushNotificationAgreed: nextValue,
    })
  }

  const openPolicy = (documentId: string) => {
    setViewerDocument(userPolicyDocuments[documentId] ?? null)
  }

  const selectAgeConsentMode = (mode: Exclude<AgeConsentMode, null>) => {
    setAgeConsentMode(mode)
    setConsents((current) => ({
      ...current,
      ageConfirmed: true,
    }))
  }

  const updateGuardianField = (key: keyof MinorGuardianConsentFields, value: string) => {
    setGuardianFields((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!displayName.trim() || !email.trim() || password.length < 6) {
      setErrorMessage('닉네임, 이메일, 비밀번호 6자 이상을 확인해주세요.')
      return
    }

    if (!allRequiredAgreed) {
      setErrorMessage('필수 동의 항목에 모두 동의해야 회원가입을 진행할 수 있습니다.')
      return
    }

    if (requiresGuardianDetails && !guardianFieldsCompleted) {
        setErrorMessage(
          '만 14세 미만 가입은 보호자 이름, 이메일, 연락처, 관계를 모두 입력해야 진행할 수 있습니다.'
        )
        return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const supabase = createClient()
    const guardianRequestedAt = ageConsentMode === 'guardian' ? new Date().toISOString() : null
    const ageBand = ageConsentMode === 'guardian' ? 'under_14' : '14_or_over'
    const guardianConsentStatus = ageConsentMode === 'guardian' ? 'pending' : 'not_required'
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          ...buildUserTermsConsentMetadata(consents),
          ...buildGuardianProfileMetadata({
            ageBand,
            guardianConsentStatus,
            requestedAt: guardianRequestedAt,
          }),
        },
      },
    })

    if (error) {
      setIsSubmitting(false)
      setErrorMessage(error.message)
      return
    }

    if (!data.user) {
      setIsSubmitting(false)
      setErrorMessage('회원가입 정보를 확인하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    const consentRecord = buildUserTermsConsentRecord(data.user.id, consents)
    const { error: consentError } = await supabase
      .from('user_terms_consents')
      .upsert(consentRecord, { onConflict: USER_TERMS_CONSENT_CONFLICT_KEY })

    if (consentError) {
      storePendingUserTermsConsent(consentRecord)
    }

    if (ageConsentMode === 'guardian' && guardianRequestedAt) {
      const guardianRecord = buildMinorGuardianConsentRecord(
        data.user.id,
        guardianFields,
        guardianRequestedAt
      )
      const { error: guardianConsentError } = await supabase
        .from('minor_guardian_consents')
        .upsert(guardianRecord, { onConflict: 'user_id' })

      if (guardianConsentError) {
        storePendingMinorGuardianConsent(guardianRecord)
      }
    }

    setIsSubmitting(false)
    router.replace(ageConsentMode === 'guardian' ? '/main/guardian-consent' : redirectPath)
    router.refresh()
  }

  return (
    <>
      <main className="relative flex min-h-screen flex-col bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
        <header className="z-20 flex items-center justify-between">
          <Link
            href={backHref}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10"
            aria-label="뒤로 가기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">Sign Up</span>
        </header>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
          <div className="h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-white/5 blur-[100px]"></div>
        </div>

        <div className="z-10 mx-auto flex w-full max-w-3xl flex-1 items-center py-8">
          <div className="w-full rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-10">
            <div className="mb-8 space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">{BRAND.name} 회원가입</h1>
              <p className="text-sm leading-6 text-zinc-400 md:text-base">
                계정을 만드는 순간부터 이용 기준이 분명해야 더 안심하고 머물 수 있다고 생각했습니다. 기본 정보와 약관 동의를 한 번에 정리해 바로 시작할 수 있게 준비했습니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6">
              <section className="grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-6">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Basic Info</p>
                  <h2 className="text-2xl font-bold tracking-tight text-white">기본 정보</h2>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm text-zinc-300">닉네임</span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                    placeholder="표시될 이름"
                    autoComplete="nickname"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm text-zinc-300">이메일</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm text-zinc-300">비밀번호</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                    placeholder="6자 이상"
                    autoComplete="new-password"
                  />
                </label>
              </section>

              <section className="grid gap-5 rounded-[28px] border border-white/10 bg-black/20 p-6">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Agreements</p>
                  <h2 className="text-2xl font-bold tracking-tight text-white">약관 동의</h2>
                  <p className="text-sm leading-6 text-zinc-400">
                    필수 동의와 선택 동의를 나누어 보여드려요. 필요한 정책은 바로 열어보고 차분히 확인한 뒤 진행할 수 있습니다.
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-50">
                  <input
                    type="checkbox"
                    checked={allConsentsChecked}
                    onChange={toggleAllConsents}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
                  />
                  <span>
                    전체 동의
                    <span className="mt-1 block text-xs leading-5 text-emerald-100/80">
                      필수 항목과 선택 항목을 함께 체크합니다. 선택 항목은 언제든지 바꿀 수 있습니다.
                    </span>
                  </span>
                </label>

                <div className="grid gap-3">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">필수 동의 항목</p>
                    <p className="text-xs leading-5 text-zinc-500">
                      아래 항목에 모두 동의해야 회원가입을 진행할 수 있습니다.
                    </p>
                  </div>

                  {requiredConsentItemsExcludingAge.map((item) => (
                    <ConsentRow
                      key={item.key}
                      checked={consents[item.key]}
                      label={item.label}
                      onToggle={() => toggleConsent(item.key)}
                      onView={() => openPolicy(item.documentId)}
                    />
                  ))}

                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">연령 확인 및 보호자 동의</p>
                        <p className="text-xs leading-5 text-zinc-500">
                          아래 두 항목 중 현재 가입 상황에 맞는 하나를 선택해 주세요.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openPolicy(agePolicyDocumentId)}
                        className="inline-flex shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10"
                      >
                        보기
                      </button>
                    </div>

                    <AgeConsentRow
                      checked={ageConsentMode === 'adult'}
                      label={AGE_ADULT_CONSENT_LABEL}
                      description="본인 기준으로 회원가입을 진행합니다."
                      onSelect={() => selectAgeConsentMode('adult')}
                    />

                    <AgeConsentRow
                      checked={ageConsentMode === 'guardian'}
                      label={AGE_GUARDIAN_CONSENT_LABEL}
                      description="보호자 동의를 받은 상태로 가입하며, 필요 시 추가 확인 절차가 진행될 수 있습니다."
                      onSelect={() => selectAgeConsentMode('guardian')}
                    />

                    {ageConsentMode === 'guardian' ? (
                      <div className="grid gap-4 rounded-2xl border border-sky-400/20 bg-sky-500/5 p-4">
                        <p className="text-xs leading-5 text-sky-100/80">
                          만 14세 미만 가입은 보호자 동의 요청 정보를 남긴 뒤 확인 대기 상태로 생성됩니다.
                          확인 전에는 결제와 작가 등록 기능이 제한되며, 추후 휴대폰 본인인증 연동이 이
                          연락처를 기준으로 이어질 수 있습니다.
                        </p>

                        <label className="block space-y-2">
                          <span className="text-sm text-zinc-300">보호자 이름</span>
                          <input
                            value={guardianFields.guardianName}
                            onChange={(event) => updateGuardianField('guardianName', event.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                            placeholder="예: 홍길동"
                            autoComplete="name"
                          />
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm text-zinc-300">보호자 이메일</span>
                          <input
                            type="email"
                            value={guardianFields.guardianEmail}
                            onChange={(event) => updateGuardianField('guardianEmail', event.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                            placeholder="guardian@example.com"
                            autoComplete="email"
                          />
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm text-zinc-300">보호자 연락처</span>
                          <input
                            type="tel"
                            value={guardianFields.guardianPhone}
                            onChange={(event) => updateGuardianField('guardianPhone', event.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                            placeholder="010-1234-5678"
                            autoComplete="tel"
                          />
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm text-zinc-300">관계</span>
                          <input
                            value={guardianFields.guardianRelationship}
                            onChange={(event) => updateGuardianField('guardianRelationship', event.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                            placeholder="예: 부모, 법정대리인"
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">선택 동의 항목</p>
                    <p className="text-xs leading-5 text-zinc-500">
                      혜택 안내와 개인화 기능을 위한 동의입니다. 동의하지 않아도 기본 이용은 가능합니다.
                    </p>
                  </div>

                  {optionalSignUpConsentItems.map((item) => (
                    <ConsentRow
                      key={item.key}
                      checked={consents[item.key]}
                      label={item.label}
                      onToggle={() => toggleConsent(item.key)}
                      onView={() => openPolicy(item.documentId)}
                    />
                  ))}
                </div>
              </section>

              {!allRequiredAgreed ? (
                <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  필수 동의 항목에 모두 동의해야 회원가입을 진행할 수 있습니다.
                </p>
              ) : null}

              {allRequiredAgreed && requiresGuardianDetails && !guardianFieldsCompleted ? (
                <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  만 14세 미만 가입은 보호자 이름, 이메일, 연락처, 관계를 모두 입력해야 회원가입을 진행할 수 있습니다.
                </p>
              ) : null}

              {errorMessage ? (
                <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitDisabled}
                className="w-full rounded-2xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? '가입 중...' : '회원가입 완료'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <PolicyViewerModal document={viewerDocument} onClose={() => setViewerDocument(null)} />
    </>
  )
}
