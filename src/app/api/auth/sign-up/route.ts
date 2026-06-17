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
import { isStagingEnvironment } from '@/lib/env/app-env'
import { getSupabaseServiceRoleKey } from '@/lib/env/server'
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

function canUseStagingVerificationCodeFallback() {
  return isStagingEnvironment()
}

function hasServerAdminKey() {
  return Boolean(getSupabaseServiceRoleKey())
}

function getSignUpErrorPayload(errorMessage: string) {
  const readableMessage = getReadableSignUpErrorMessage(errorMessage)

  if (
    isStagingEnvironment() &&
    readableMessage === '회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.' &&
    errorMessage
  ) {
    return {
      error: `스테이징 회원가입 설정을 확인해야 합니다: ${errorMessage}`,
    }
  }

  return { error: readableMessage }
}

function buildSignUpUserMetadata({
  ageBand,
  consents,
  displayName,
  guardianConsentStatus,
  guardianRequestedAt,
}: {
  ageBand: GuardianAgeBand
  consents: SignUpConsentValues
  displayName: string
  guardianConsentStatus: GuardianConsentStatus
  guardianRequestedAt: string | null
}) {
  return {
    display_name: displayName,
    ...buildUserTermsConsentMetadata(consents),
    ...buildGuardianProfileMetadata({
      ageBand,
      guardianConsentStatus,
      requestedAt: guardianRequestedAt,
    }),
  }
}

async function findAuthUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  const perPage = 1000

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(error.message || '기존 회원 정보를 확인하지 못했습니다.')
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email)

    if (user) {
      return user
    }

    if (!data.nextPage) {
      return null
    }
  }

  return null
}

async function syncStagingProfileAndConsents({
  admin,
  ageBand,
  consents,
  displayName,
  guardianConsentStatus,
  guardianFields,
  guardianRequestedAt,
  requiresGuardianDetails,
  userId,
}: {
  admin: ReturnType<typeof createAdminClient>
  ageBand: GuardianAgeBand
  consents: SignUpConsentValues
  displayName: string
  guardianConsentStatus: GuardianConsentStatus
  guardianFields: MinorGuardianConsentFields
  guardianRequestedAt: string | null
  requiresGuardianDetails: boolean
  userId: string
}) {
  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        display_name: displayName,
        age_band: ageBand,
        guardian_consent_status: guardianConsentStatus,
        guardian_consent_requested_at: guardianRequestedAt,
      },
      { onConflict: 'id' }
    )

  if (profileError) {
    throw new Error(profileError.message || '프로필 정보를 저장하지 못했습니다.')
  }

  const consentRecord = buildUserTermsConsentRecord(userId, consents)
  const { error: consentError } = await admin
    .from('user_terms_consents')
    .upsert(consentRecord, { onConflict: USER_TERMS_CONSENT_CONFLICT_KEY })

  if (consentError) {
    throw new Error(consentError.message || '약관 동의 기록을 저장하지 못했습니다.')
  }

  if (requiresGuardianDetails && guardianRequestedAt) {
    const guardianRecord = buildMinorGuardianConsentRecord(
      userId,
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
}

async function createOrUpdateStagingUserWithAdmin({
  admin,
  ageBand,
  consents,
  displayName,
  email,
  guardianConsentStatus,
  guardianFields,
  guardianRequestedAt,
  password,
  requiresGuardianDetails,
}: {
  admin: ReturnType<typeof createAdminClient>
  ageBand: GuardianAgeBand
  consents: SignUpConsentValues
  displayName: string
  email: string
  guardianConsentStatus: GuardianConsentStatus
  guardianFields: MinorGuardianConsentFields
  guardianRequestedAt: string | null
  password: string
  requiresGuardianDetails: boolean
}) {
  const userMetadata = buildSignUpUserMetadata({
    ageBand,
    consents,
    displayName,
    guardianConsentStatus,
    guardianRequestedAt,
  })
  const existingUser = await findAuthUserByEmail(admin, email)
  const authResult = existingUser
    ? await admin.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
        password,
        user_metadata: userMetadata,
      })
    : await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
        user_metadata: userMetadata,
      })

  if (authResult.error || !authResult.data.user) {
    throw new Error(authResult.error?.message || '스테이징 테스트 회원을 생성하지 못했습니다.')
  }

  await syncStagingProfileAndConsents({
    admin,
    ageBand,
    consents,
    displayName,
    guardianConsentStatus,
    guardianFields,
    guardianRequestedAt,
    requiresGuardianDetails,
    userId: authResult.data.user.id,
  })

  return NextResponse.json({
    ok: true,
    autoSignIn: true,
    email,
    emailDelivery: 'staging_admin_confirmed',
    adminMode: existingUser ? 'staging_admin_updated' : 'staging_admin_created',
    userId: authResult.data.user.id,
  })
}

async function createStagingUserWithoutAdmin({
  ageBand,
  displayName,
  email,
  guardianConsentStatus,
  guardianRequestedAt,
  redirectTo,
  consents,
}: {
  ageBand: GuardianAgeBand
  displayName: string
  email: string
  guardianConsentStatus: GuardianConsentStatus
  guardianRequestedAt: string | null
  redirectTo: string
  consents: SignUpConsentValues
}) {
  const createdAt = new Date().toISOString()
  const userId = crypto.randomUUID()

  return NextResponse.json({
    ok: true,
    email,
    userId,
    emailDelivery: 'staging_mock_no_email',
    adminMode: 'staging_mock_fallback',
    mockAuth: {
      createdAt,
      displayName,
      email,
      guardianConsentStatus,
      redirectTo,
      userId,
      metadata: {
        ageBand,
        guardianRequestedAt,
        ...buildUserTermsConsentMetadata(consents),
        ...buildGuardianProfileMetadata({
          ageBand,
          guardianConsentStatus,
          requestedAt: guardianRequestedAt,
        }),
      },
    },
  })
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

  const guardianRequestedAt = requiresGuardianDetails ? new Date().toISOString() : null
  const ageBand: GuardianAgeBand = requiresGuardianDetails ? 'under_14' : '14_or_over'
  const guardianConsentStatus: GuardianConsentStatus = requiresGuardianDetails
    ? 'pending'
    : 'not_required'
  const afterVerifyPath = requiresGuardianDetails ? '/main/guardian-consent' : nextPath
  const redirectTo = `${request.nextUrl.origin}/auth/callback?next=${encodeURIComponent(afterVerifyPath)}`
  let createdUserId: string | null = null
  let admin: ReturnType<typeof createAdminClient> | null = null

  try {
    if (!hasServerAdminKey() && isStagingEnvironment()) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY missing in staging; using mock signup fallback.')

      return await createStagingUserWithoutAdmin({
        ageBand,
        displayName,
        email,
        guardianConsentStatus,
        guardianRequestedAt,
        redirectTo,
        consents,
      })
    }

    admin = createAdminClient()

    if (isStagingEnvironment()) {
      return await createOrUpdateStagingUserWithAdmin({
        admin,
        ageBand,
        consents,
        displayName,
        email,
        guardianConsentStatus,
        guardianFields,
        guardianRequestedAt,
        password,
        requiresGuardianDetails,
      })
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo,
        data: buildSignUpUserMetadata({
          ageBand,
          consents,
          displayName,
          guardianConsentStatus,
          guardianRequestedAt,
        }),
      },
    })

    if (error || !data.user || !data.properties?.email_otp) {
      const message = error?.message ?? 'Supabase 인증코드를 생성하지 못했습니다.'
      console.error('Signup link generation failed:', message)

      return NextResponse.json(
        getSignUpErrorPayload(message),
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

    try {
      const confirmationEmail = buildSignupConfirmationEmail({
        displayName,
        otp: data.properties.email_otp,
      })

      await sendSmtpMail({
        to: email,
        ...confirmationEmail,
      })
    } catch (mailError) {
      if (!canUseStagingVerificationCodeFallback()) {
        throw mailError
      }

      console.warn('Using staging signup verification code fallback:', mailError)

      return NextResponse.json({
        ok: true,
        email,
        nextPath: afterVerifyPath,
        emailDelivery: 'staging_fallback',
        debugVerificationCode: data.properties.email_otp,
      })
    }

    return NextResponse.json({ ok: true, email, nextPath: afterVerifyPath, emailDelivery: 'sent' })
  } catch (error) {
    if (createdUserId && admin) {
      await admin.auth.admin.deleteUser(createdUserId).catch(() => null)
    }

    const message = error instanceof Error ? error.message : String(error)
    console.error('Signup failed:', message)

    return NextResponse.json(
      getSignUpErrorPayload(message),
      { status: 500 }
    )
  }
}
