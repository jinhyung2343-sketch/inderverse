'use server'

import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  CREATOR_AGREEMENT_VERSION,
  requiredCreatorAgreementConsentItems,
} from '@/lib/creator-agreement'
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
    redirect('/main/studio/creator-channel')
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
  redirect('/main/studio/creator-channel')
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
    console.error(error)
    return {
      error: '작가 등록에 필요한 계정 정보를 확인하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  const currentRole = profile.role as UserRole | undefined

  if (currentRole === 'creator' || currentRole === 'admin') {
    redirect('/main/studio/creator-channel')
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
    console.error(consentError)
    return {
      error: '동의 기록을 저장하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  const { error: roleError } = await admin
    .from('profiles')
    .update({ role: 'creator' })
    .eq('id', user.id)

  if (roleError) {
    console.error(roleError)
    return {
      error: '작가 권한 전환 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  revalidatePath('/main')
  revalidatePath('/main/studio')
  revalidatePath('/main/studio/creator-agreement')
  revalidatePath('/main/studio/creator-channel')
  revalidatePath('/main/studio/channels')
  redirect('/main/studio/creator-channel')
}
