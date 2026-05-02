'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { CREATOR_AGREEMENT_VERSION } from '@/lib/creator-agreement'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type UserRole = Database['public']['Enums']['user_role']

export interface CreatorAgreementActionState {
  error: string | null
}

export const initialCreatorAgreementState: CreatorAgreementActionState = {
  error: null,
}

export async function becomeCreator() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt?next=/main/studio')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const currentRole = profile?.role as UserRole | undefined

  if (currentRole === 'creator' || currentRole === 'admin') {
    redirect('/main/studio/channels')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'creator' })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/main/studio')
  revalidatePath('/main/studio/channels')
  redirect('/main/studio/channels')
}

export async function acceptCreatorAgreement(
  _prevState: CreatorAgreementActionState,
  formData: FormData
): Promise<CreatorAgreementActionState> {
  const agreed = formData.get('creatorAgreementAccepted') === 'on'
  const agreedAt = new Date().toISOString()

  if (!agreed) {
    return {
      error: '필수 동의 항목에 동의해야 작가 등록을 진행할 수 있습니다.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/join-prompt?next=/main/studio/creator-agreement')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const currentRole = profile?.role as UserRole | undefined

  if (currentRole === 'creator' || currentRole === 'admin') {
    redirect('/main/studio/channels')
  }

  const { error: consentError } = await supabase
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
    return {
      error: '동의 기록을 저장하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'creator' })
    .eq('id', user.id)

  if (roleError) {
    return {
      error: '작가 권한 전환 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  revalidatePath('/main')
  revalidatePath('/main/studio')
  revalidatePath('/main/studio/channels')
  redirect('/main/studio/channels')
}
