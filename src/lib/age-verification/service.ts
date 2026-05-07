import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { AgeVerificationProvider, VerificationStatePayload } from './types'

const oneYearMs = 365 * 24 * 60 * 60 * 1000

function getStateSecret() {
  const secret = process.env.AGE_VERIFICATION_STATE_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AGE_VERIFICATION_STATE_SECRET must be set in production')
    }

    return 'inderverse-dev-age-verification-secret'
  }

  return secret
}

function getProviderSecret() {
  return process.env.AGE_VERIFICATION_PROVIDER_SECRET || ''
}

export function createVerificationState(
  payload: Omit<VerificationStatePayload, 'issuedAt'>
) {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      issuedAt: Date.now(),
    } satisfies VerificationStatePayload)
  ).toString('base64url')

  const signature = createHmac('sha256', getStateSecret()).update(body).digest('base64url')

  return `${body}.${signature}`
}

export function parseVerificationState(state: string) {
  const [body, signature] = state.split('.')

  if (!body || !signature) {
    throw new Error('Invalid verification state format')
  }

  const expectedSignature = createHmac('sha256', getStateSecret()).update(body).digest('base64url')
  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('Invalid verification state signature')
  }

  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as VerificationStatePayload
}

export function verifyProviderResultSignature({
  provider,
  verificationState,
  approved,
  ciHash,
  signature,
}: {
  provider: AgeVerificationProvider
  verificationState: string
  approved: boolean
  ciHash?: string
  signature?: string
}) {
  const providerSecret = getProviderSecret()

  if (!providerSecret || !signature) {
    return false
  }

  const payload = [provider, verificationState, String(approved), ciHash ?? ''].join(':')
  const expectedSignature = createHmac('sha256', providerSecret).update(payload).digest('hex')
  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function isDevManualAgeVerificationEnabled() {
  return process.env.ENABLE_DEV_MANUAL_AGE_VERIFICATION === 'true'
}

export async function recordAdultVerification({
  userId,
  provider,
  ciHash,
}: {
  userId: string
  provider: AgeVerificationProvider
  ciHash?: string
}) {
  const adminClient = createAdminClient()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + oneYearMs)

  const { error: verificationError } = await adminClient
    .from('age_verifications')
    .upsert(
      {
        user_id: userId,
        provider,
        verified_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        ci_hash: ciHash ?? null,
      },
      { onConflict: 'user_id,provider' }
    )

  if (verificationError) {
    throw verificationError
  }

  const profilePatch: {
    is_adult_verified: boolean
    phone_verified_at?: string
  } = {
    is_adult_verified: true,
  }

  if (provider === 'pass' || provider === 'phone') {
    profilePatch.phone_verified_at = now.toISOString()
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update(profilePatch)
    .eq('id', userId)

  if (profileError) {
    throw profileError
  }

  return {
    verifiedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }
}
