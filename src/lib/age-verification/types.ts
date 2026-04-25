import { Database } from '@/lib/supabase/types'

export type AgeVerificationProvider = Database['public']['Enums']['age_verify_provider']

export type VerificationStatePayload = {
  userId: string
  provider: AgeVerificationProvider
  returnUrl?: string
  issuedAt: number
}

export type VerificationProviderConfig = {
  provider: AgeVerificationProvider
  label: string
  mode: 'redirect' | 'manual'
  externalStartUrl?: string
  callbackPath: string
  instructions: string
  requiresProviderSignature?: boolean
}
