'use server'

import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  CREATOR_AGREEMENT_VERSION,
  requiredCreatorAgreementConsentItems,
} from '@/lib/creator-agreement'
import { BRAND } from '@/lib/brand'
import { encryptBankInfo, hasAnyBankInfo } from '@/lib/security/bank-info'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type UserRole = Database['public']['Enums']['user_role']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type CreatorAgreementActionState = {
  error: string | null
}

function readUserMetadataText(user: User, key: string) {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readInteger(formData: FormData, key: string, fallback = 0) {
  const value = readText(formData, key)

  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isInteger(parsed)) {
    throw new Error(`${key} 값이 올바르지 않습니다.`)
  }

  return parsed
}

function isPayoutMethod(
  value: string
): value is Database['public']['Enums']['payout_method'] {
  return value === 'bank_transfer' || value === 'paypal'
}

function parseCreatorRevenueSettings(formData: FormData) {
  const minPayoutAmount = readInteger(formData, 'minPayoutAmount', 10000)
  const payoutMethodValue = readText(formData, 'payoutMethod')
  const bankInfo = {
    bankName: readText(formData, 'bankName'),
    accountHolder: readText(formData, 'accountHolder'),
    accountNumber: readText(formData, 'accountNumber'),
  }

  if (minPayoutAmount < 1000) {
    throw new Error('최소 정산 금액은 1000원 이상이어야 합니다.')
  }

  if (payoutMethodValue && !isPayoutMethod(payoutMethodValue)) {
    throw new Error('유효하지 않은 정산 방식입니다.')
  }

  const payoutMethod = isPayoutMethod(payoutMethodValue) ? payoutMethodValue : null

  if (
    payoutMethod === 'bank_transfer' &&
    (!bankInfo.bankName || !bankInfo.accountHolder || !bankInfo.accountNumber)
  ) {
    throw new Error('계좌 이체를 선택한 경우 은행명, 예금주, 계좌번호를 모두 입력해 주세요.')
  }

  return {
    creator_share_pct: BRAND.creatorSharePct,
    min_payout_amount: minPayoutAmount,
    payout_method: payoutMethod,
    bank_info_encrypted: hasAnyBankInfo(bankInfo) ? encryptBankInfo(bankInfo) : null,
  }
}

async function ensureProfileForStudioAccess(user: User): Promise<Pick<ProfileRow, 'id' | 'role'>> {
  const admin = createAdminClient()
  const { data: existingProfile, error: profileError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Failed to load profile for studio access: ${profileError.message}`)
  }

  if (existingProfile) {
    return existingProfile
  }

  const displayName = readUserMetadataText(user, 'display_name') || user.email?.split('@')[0] || '유저'
  const ageBand = readUserMetadataText(user, 'user_age_band') || '14_or_over'
  const guardianConsentStatus =
    readUserMetadataText(user, 'user_guardian_consent_status') || 'not_required'
  const requestedAt = readUserMetadataText(user, 'user_guardian_consent_requested_at') || null

  const { data: createdProfile, error: createProfileError } = await admin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        display_name: displayName,
        role: 'reader',
        age_band: ageBand,
        guardian_consent_status: guardianConsentStatus,
        guardian_consent_requested_at: requestedAt,
      },
      { onConflict: 'id' }
    )
    .select('id, role')
    .single()

  if (createProfileError || !createdProfile) {
    throw new Error(
      `Failed to create missing profile for studio access: ${createProfileError?.message ?? 'unknown error'}`
    )
  }

  return createdProfile
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return String(error)
}

export async function becomeCreator() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt?next=/main/studio')
  }

  const profile = await ensureProfileForStudioAccess(user)
  const currentRole = profile.role as UserRole | undefined

  if (currentRole === 'creator' || currentRole === 'admin') {
    redirect('/main/studio')
  }

  const { error } = await admin
    .from('profiles')
    .update({ role: 'creator' })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/main/studio')
  revalidatePath('/main/studio/creator-channel')
  revalidatePath('/main/studio/channels')
  redirect('/main/studio/channels?setup=1')
}

export async function acceptCreatorAgreement(
  _prevState: CreatorAgreementActionState,
  formData: FormData
): Promise<CreatorAgreementActionState> {
  const agreed = requiredCreatorAgreementConsentItems.every(
    (item) => formData.get(item.fieldName) === 'on'
  )
  const agreedAt = new Date().toISOString()

  if (!agreed) {
    return {
      error: '필수 동의 항목에 모두 동의해야 작가 등록을 진행할 수 있습니다.',
    }
  }

  const supabase = await createClient()
  const admin = createAdminClient()
  let revenueSettings: ReturnType<typeof parseCreatorRevenueSettings>

  try {
    revenueSettings = parseCreatorRevenueSettings(formData)
  } catch (error) {
    return {
      error: getErrorMessage(error),
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt?next=/main/studio/creator-agreement')
  }

  let profile: Pick<ProfileRow, 'id' | 'role'>

  try {
    profile = await ensureProfileForStudioAccess(user)
  } catch (error) {
    console.error('Studio action error:', getErrorMessage(error))
    return {
      error: '작가 등록에 필요한 계정 정보를 확인하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  const currentRole = profile.role as UserRole | undefined

  if (currentRole === 'creator' || currentRole === 'admin') {
    redirect('/main/studio')
  }

  const { error: consentError } = await admin
    .from('creator_agreement_consents')
    .upsert(
      {
        user_id: user.id,
        agreement_version: CREATOR_AGREEMENT_VERSION,
        is_agreed: true,
        agreed_at: agreedAt,
        updated_at: agreedAt,
      },
      { onConflict: 'user_id,agreement_version' }
    )

  if (consentError) {
    console.error('Studio action error:', getErrorMessage(consentError))
    return {
      error: '동의 기록을 저장하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  const { error: revenueError } = await admin
    .from('creator_revenue_settings')
    .upsert(
      {
        creator_id: user.id,
        ...revenueSettings,
        updated_at: agreedAt,
      },
      { onConflict: 'creator_id' }
    )

  if (revenueError) {
    console.error('Studio action error:', getErrorMessage(revenueError))
    return {
      error: '작가 정산 설정을 저장하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  const { error: roleError } = await admin
    .from('profiles')
    .update({ role: 'creator' })
    .eq('id', user.id)

  if (roleError) {
    console.error('Studio action error:', getErrorMessage(roleError))
    return {
      error: '작가 권한 전환 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  revalidatePath('/main')
  revalidatePath('/main/studio')
  revalidatePath('/main/studio/creator-agreement')
  revalidatePath('/main/studio/creator-channel')
  revalidatePath('/main/studio/channels')
  redirect('/main/studio/channels?setup=1')
}
