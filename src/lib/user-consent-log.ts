import type { Database } from '@/lib/supabase/types'

export const USER_TERMS_VERSION = 'user_terms_v1.0'
export const PRIVACY_POLICY_VERSION = 'privacy_policy_v1.0'
export const PAYMENT_POLICY_VERSION = 'payment_policy_v1.0'
export const COMMUNITY_POLICY_VERSION = 'community_policy_v1.0'

export const PENDING_USER_TERMS_CONSENT_KEY = 'inderverse:pending-user-terms-consent'
export const USER_TERMS_CONSENT_CONFLICT_KEY =
  'user_id,terms_version,privacy_version,payment_policy_version,community_policy_version'

export interface SignUpConsentValues {
  requiredTermsAgreed: boolean
  privacyAgreed: boolean
  ageConfirmed: boolean
  paymentPolicyAgreed: boolean
  communityPolicyAgreed: boolean
  marketingAgreed: boolean
  recommendationDataAgreed: boolean
  emailNotificationAgreed: boolean
  pushNotificationAgreed: boolean
}

export function getInitialSignUpConsentValues(): SignUpConsentValues {
  return {
    requiredTermsAgreed: false,
    privacyAgreed: false,
    ageConfirmed: false,
    paymentPolicyAgreed: false,
    communityPolicyAgreed: false,
    marketingAgreed: false,
    recommendationDataAgreed: false,
    emailNotificationAgreed: false,
    pushNotificationAgreed: false,
  }
}

export function hasAcceptedAllRequiredSignUpConsents(values: SignUpConsentValues) {
  return (
    values.requiredTermsAgreed &&
    values.privacyAgreed &&
    values.ageConfirmed &&
    values.paymentPolicyAgreed &&
    values.communityPolicyAgreed
  )
}

export function buildUserTermsConsentMetadata(values: SignUpConsentValues) {
  return {
    user_terms_version: USER_TERMS_VERSION,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
    payment_policy_version: PAYMENT_POLICY_VERSION,
    community_policy_version: COMMUNITY_POLICY_VERSION,
    user_required_terms_agreed: values.requiredTermsAgreed,
    user_privacy_agreed: values.privacyAgreed,
    user_age_confirmed: values.ageConfirmed,
    user_payment_policy_agreed: values.paymentPolicyAgreed,
    user_community_policy_agreed: values.communityPolicyAgreed,
    user_marketing_agreed: values.marketingAgreed,
    user_recommendation_data_agreed: values.recommendationDataAgreed,
    user_email_notification_agreed: values.emailNotificationAgreed,
    user_push_notification_agreed: values.pushNotificationAgreed,
  }
}

export function buildUserTermsConsentRecord(
  userId: string,
  values: SignUpConsentValues,
  agreedAt = new Date().toISOString()
): Database['public']['Tables']['user_terms_consents']['Insert'] {
  return {
    user_id: userId,
    terms_version: USER_TERMS_VERSION,
    privacy_version: PRIVACY_POLICY_VERSION,
    payment_policy_version: PAYMENT_POLICY_VERSION,
    community_policy_version: COMMUNITY_POLICY_VERSION,
    required_terms_agreed: values.requiredTermsAgreed,
    privacy_agreed: values.privacyAgreed,
    age_confirmed: values.ageConfirmed,
    payment_policy_agreed: values.paymentPolicyAgreed,
    community_policy_agreed: values.communityPolicyAgreed,
    marketing_agreed: values.marketingAgreed,
    recommendation_data_agreed: values.recommendationDataAgreed,
    email_notification_agreed: values.emailNotificationAgreed,
    push_notification_agreed: values.pushNotificationAgreed,
    agreed_at: agreedAt,
    updated_at: agreedAt,
  }
}

export function storePendingUserTermsConsent(
  record: Database['public']['Tables']['user_terms_consents']['Insert']
) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PENDING_USER_TERMS_CONSENT_KEY, JSON.stringify(record))
}

export function readPendingUserTermsConsent():
  | Database['public']['Tables']['user_terms_consents']['Insert']
  | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(PENDING_USER_TERMS_CONSENT_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as Database['public']['Tables']['user_terms_consents']['Insert']
  } catch {
    return null
  }
}

export function clearPendingUserTermsConsent() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(PENDING_USER_TERMS_CONSENT_KEY)
}
