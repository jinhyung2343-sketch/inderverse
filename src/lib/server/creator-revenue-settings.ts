import 'server-only'

import { BRAND } from '@/lib/brand'
import { decryptBankInfo, getMaskedBankSummary } from '@/lib/security/bank-info'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type CreatorRevenueSettingsRow = Pick<
  Database['public']['Tables']['creator_revenue_settings']['Row'],
  'creator_share_pct' | 'min_payout_amount' | 'payout_method' | 'bank_info_encrypted'
>

export interface CreatorRevenueSettingsSummary {
  creatorSharePct: number
  minPayoutAmount: number
  payoutMethod: Database['public']['Enums']['payout_method'] | null
  maskedBankSummary: string | null
  hasStoredBankInfo: boolean
}

export async function getCurrentCreatorRevenueSettings(): Promise<CreatorRevenueSettingsSummary> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      creatorSharePct: BRAND.creatorSharePct,
      minPayoutAmount: 10000,
      payoutMethod: null,
      maskedBankSummary: null,
      hasStoredBankInfo: false,
    }
  }

  const { data, error } = await supabase
    .from('creator_revenue_settings')
    .select('creator_share_pct, min_payout_amount, payout_method, bank_info_encrypted')
    .eq('creator_id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load creator revenue settings: ${error.message}`)
  }

  const settings = data as CreatorRevenueSettingsRow | null
  const bankInfo = decryptBankInfo(settings?.bank_info_encrypted ?? null)

  return {
    creatorSharePct: settings?.creator_share_pct ?? BRAND.creatorSharePct,
    minPayoutAmount: settings?.min_payout_amount ?? 10000,
    payoutMethod: settings?.payout_method ?? null,
    maskedBankSummary: getMaskedBankSummary(bankInfo),
    hasStoredBankInfo: Boolean(settings?.bank_info_encrypted),
  }
}
