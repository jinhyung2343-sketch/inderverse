import type { Database } from '@/lib/supabase/types'

export const GUARDIAN_CONSENT_VERSION = 'guardian_consent_v1.0'
export const PENDING_MINOR_GUARDIAN_CONSENT_KEY = 'inderverse:pending-minor-guardian-consent'

export type GuardianAgeBand = '14_or_over' | 'under_14'
export type GuardianConsentStatus = 'not_required' | 'pending' | 'verified' | 'rejected'

export interface MinorGuardianConsentFields {
  guardianName: string
  guardianEmail: string
  guardianPhone: string
  guardianRelationship: string
}

export function buildGuardianProfileMetadata({
  ageBand,
  guardianConsentStatus,
  requestedAt,
}: {
  ageBand: GuardianAgeBand
  guardianConsentStatus: GuardianConsentStatus
  requestedAt?: string | null
}) {
  return {
    user_age_band: ageBand,
    user_guardian_consent_status: guardianConsentStatus,
    user_guardian_consent_requested_at: requestedAt,
  }
}

export function buildMinorGuardianConsentRecord(
  userId: string,
  fields: MinorGuardianConsentFields,
  requestedAt = new Date().toISOString()
): Database['public']['Tables']['minor_guardian_consents']['Insert'] {
  return {
    user_id: userId,
    consent_version: GUARDIAN_CONSENT_VERSION,
    guardian_name: fields.guardianName.trim(),
    guardian_email: fields.guardianEmail.trim().toLowerCase(),
    guardian_phone: fields.guardianPhone.trim(),
    guardian_relationship: fields.guardianRelationship.trim(),
    status: 'pending',
    verification_channel: 'phone',
    verification_note: '향후 PASS/통신사 본인인증 연동 예정',
    requested_at: requestedAt,
    updated_at: requestedAt,
  }
}

export function storePendingMinorGuardianConsent(
  record: Database['public']['Tables']['minor_guardian_consents']['Insert']
) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PENDING_MINOR_GUARDIAN_CONSENT_KEY, JSON.stringify(record))
}

export function readPendingMinorGuardianConsent():
  | Database['public']['Tables']['minor_guardian_consents']['Insert']
  | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(PENDING_MINOR_GUARDIAN_CONSENT_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as Database['public']['Tables']['minor_guardian_consents']['Insert']
  } catch {
    return null
  }
}

export function clearPendingMinorGuardianConsent() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(PENDING_MINOR_GUARDIAN_CONSENT_KEY)
}
