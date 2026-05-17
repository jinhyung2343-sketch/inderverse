import { NextRequest, NextResponse } from 'next/server'
import {
  buildGuardianProfileMetadata,
  buildMinorGuardianConsentRecord,
  type GuardianAgeBand,
  type GuardianConsentStatus,
  type MinorGuardianConsentFields,
} from '@/lib/minor-guardian-consent'
import {
  buildUserTermsConsentMetadata,
  buildUserTermsConsentRecord,
  hasAcceptedAllRequiredSignUpConsents,
  USER_TERMS_CONSENT_CONFLICT_KEY,
  type SignUpConsentValues,
} from '@/lib/user-consent-log'
import { sanitizeInternalPath } from '@/lib/guest-policy'
import { buildSignupConfirmationEmail } from '@/lib/server/signup-confirmation-email'
import { sendSmtpMail } from '@/lib/server/smtp-mailer'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type SignUpRequestBody = {
  displayName?: unknown
  email?: unknown
  password?: unknown
  consents?: Partial<SignUpConsentValues>
  ageConsentMode?: 'adult' | 'guardian' | null
  guardianFields?: Partial<MinorGuardianConsentFields>
  nextPath?: unknown
}

function normalizeConsents(values: Partial<SignUpConsentValues> | undefined): SignUpConsentValues {
  return {
    requiredTermsAgreed: Boolean(values?.requiredTermsAgreed),
    privacyAgreed: Boolean(values?.privacyAgreed),
    ageConfirmed: Boolean(values?.ageConfirmed),
    paymentPolicyAgreed: Boolean(values?.paymentPolicyAgreed),
    communityPolicyAgreed: Boolean(values?.communityPolicyAgreed),
    marketingAgreed: Boolean(values?.marketingAgreed),
    recommendationDataAgreed: Boolean(values?.recommendationDataAgreed),
    emailNotificationAgreed: Boolean(values?.emailNotificationAgreed),
    pushNotificationAgreed: Boolean(values?.pushNotificationAgreed),
  }
}

function normalizeGuardianFields(
  values: Partial<MinorGuardianConsentFields> | undefined
): MinorGuardianConsentFields {
  return {
    guardianName: String(values?.guardianName ?? ''),
    guardianEmail: String(values?.guardianEmail ?? ''),
    guardianPhone: String(values?.guardianPhone ?? ''),
    guardianRelationship: String(values?.guardianRelationship ?? ''),
  }
}

function getReadableSignUpErrorMessage(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase()

  if (normalizedMessage.includes('already') || normalizedMessage.includes('registered')) {
    return '이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 이용해 주세요.'
  }

  if (normalizedMessage.includes('invalid') && normalizedMessage.includes('email')) {
    return '이메일 형식을 확인해 주세요.'
  }

  if (normalizedMessage.includes('password')) {
    return '비밀번호 조건을 확인해 주세요.'
  }

  if (normalizedMessage.includes('smtp')) {
    return '인증 메일 발송 설정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }

  return '회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export async function POST(request: NextRequest) {
  let body: SignUpRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '회원가입 정보를 확인하지 못했습니다.' }, { status: 400 })
  }

  const displayName = String(body.displayName ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const consents = normalizeConsents(body.consents)
  const ageConsentMode = body.ageConsentMode === 'guardian' ? 'guardian' : 'adult'
  const guardianFields = normalizeGuardianFields(body.guardianFields)
  const nextPath = sanitizeInternalPath(
    typeof body.nextPath === 'string' ? body.nextPath : null,
    '/main'
  )

  if (!displayName || !email || password.length < 8) {
    return NextResponse.json(
      { error: '닉네임, 이메일, 비밀번호 8자 이상을 확인해주세요.' },
      { status: 400 }
    )
  }

  if (!hasAcceptedAllRequiredSignUpConsents(consents)) {
    return NextResponse.json(
      { error: '필수 동의 항목에 모두 동의해야 회원가입을 진행할 수 있습니다.' },
      { status: 400 }
    )
  }

  const requiresGuardianDetails = ageConsentMode === 'guardian'
  const guardianFieldsCompleted =
    guardianFields.guardianName.trim().length > 0 &&
    guardianFields.guardianEmail.trim().length > 0 &&
    guardianFields.guardianPhone.trim().length > 0 &&
    guardianFields.guardianRelationship.trim().length > 0

  if (requiresGuardianDetails && !guardianFieldsCompleted) {
    return NextResponse.json(
      { error: '만 14세 미만 가입은 보호자 이름, 이메일, 연락처, 관계를 모두 입력해야 진행할 수 있습니다.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const guardianRequestedAt = requiresGuardianDetails ? new Date().toISOString() : null
  const ageBand: GuardianAgeBand = requiresGuardianDetails ? 'under_14' : '14_or_over'
  const guardianConsentStatus: GuardianConsentStatus = requiresGuardianDetails
    ? 'pending'
    : 'not_required'
  const afterVerifyPath = requiresGuardianDetails ? '/main/guardian-consent' : nextPath
  const redirectTo = `${request.nextUrl.origin}/auth/callback?next=${encodeURIComponent(afterVerifyPath)}`
  let createdUserId: string | null = null

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo,
        data: {
          display_name: displayName,
          ...buildUserTermsConsentMetadata(consents),
          ...buildGuardianProfileMetadata({
            ageBand,
            guardianConsentStatus,
            requestedAt: guardianRequestedAt,
          }),
        },
      },
    })

    if (error || !data.user || !data.properties?.email_otp) {
      return NextResponse.json(
        { error: getReadableSignUpErrorMessage(error?.message ?? '') },
        { status: error?.status ?? 400 }
      )
    }

    createdUserId = data.user.id

    const consentRecord = buildUserTermsConsentRecord(data.user.id, consents)
    const { error: consentError } = await admin
      .from('user_terms_consents')
      .upsert(consentRecord, { onConflict: USER_TERMS_CONSENT_CONFLICT_KEY })

    if (consentError) {
      throw new Error(consentError.message || '약관 동의 기록을 저장하지 못했습니다.')
    }

    if (requiresGuardianDetails && guardianRequestedAt) {
      const guardianRecord = buildMinorGuardianConsentRecord(
        data.user.id,
        guardianFields,
        guardianRequestedAt
      )
      const { error: guardianConsentError } = await admin
        .from('minor_guardian_consents')
        .upsert(guardianRecord, { onConflict: 'user_id' })

      if (guardianConsentError) {
        throw new Error(guardianConsentError.message || '보호자 동의 정보를 저장하지 못했습니다.')
      }
    }

    const confirmationEmail = buildSignupConfirmationEmail({
      displayName,
      otp: data.properties.email_otp,
    })

    await sendSmtpMail({
      to: email,
      ...confirmationEmail,
    })

    return NextResponse.json({ ok: true, email, nextPath: afterVerifyPath })
  } catch (error) {
    if (createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId).catch(() => null)
    }

    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: getReadableSignUpErrorMessage(message) },
      { status: 500 }
    )
  }
}
