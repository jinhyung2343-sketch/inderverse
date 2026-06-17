import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type StagingMockAuthPayload = {
  userId: string
  email: string
  displayName: string
  guardianConsentStatus: string
  createdAt: string
}

const STAGING_MOCK_AUTH_KEY = 'inderverse:staging-mock-auth'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function storeStagingMockAuth(payload: StagingMockAuthPayload) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STAGING_MOCK_AUTH_KEY, JSON.stringify(payload))
}

export function readStagingMockAuth(): StagingMockAuthPayload | null {
  if (!canUseStorage()) {
    return null
  }

  const rawValue = window.localStorage.getItem(STAGING_MOCK_AUTH_KEY)

  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StagingMockAuthPayload>

    if (
      typeof parsed.userId !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.displayName !== 'string' ||
      typeof parsed.guardianConsentStatus !== 'string' ||
      typeof parsed.createdAt !== 'string'
    ) {
      return null
    }

    return parsed as StagingMockAuthPayload
  } catch {
    return null
  }
}

export function clearStagingMockAuth() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(STAGING_MOCK_AUTH_KEY)
}

export function buildStagingMockUser(payload: StagingMockAuthPayload): User {
  return {
    id: payload.userId,
    app_metadata: {},
    aud: 'authenticated',
    created_at: payload.createdAt,
    email: payload.email,
    user_metadata: {
      display_name: payload.displayName,
      guardian_consent_status: payload.guardianConsentStatus,
      role: 'reader',
    },
  } as User
}

export function buildStagingMockProfile(
  payload: StagingMockAuthPayload
): Database['public']['Tables']['profiles']['Row'] {
  return {
    age_band: payload.guardianConsentStatus === 'pending' ? 'under_14' : '14_or_over',
    avatar_url: null,
    created_at: payload.createdAt,
    display_name: payload.displayName,
    guardian_consent_requested_at: payload.guardianConsentStatus === 'pending' ? payload.createdAt : null,
    guardian_consent_status: payload.guardianConsentStatus,
    id: payload.userId,
    is_adult_verified: false,
    is_subscribed: false,
    phone_verified_at: null,
    role: 'reader',
    updated_at: payload.createdAt,
  }
}
