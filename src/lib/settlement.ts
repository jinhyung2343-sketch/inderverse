import type { Database } from '@/lib/supabase/types'
import { BRAND } from '@/lib/brand'

export type SettlementStatus = Database['public']['Enums']['settlement_status']

export interface SettlementTotals {
  totalPurchases: number
  grossRevenueCoins: number
  paidCoinRevenue: number
  freeCoinRevenue: number
  creatorAmount: number
  platformAmount: number
}

export function getSettlementStatusLabel(status: SettlementStatus) {
  switch (status) {
    case 'pending':
      return '대기 중'
    case 'processing':
      return '처리 중'
    case 'completed':
      return '지급 완료'
    case 'failed':
      return '실패'
    default:
      return status
  }
}

export function calculateSettlementAmounts(paidCoinRevenue: number) {
  // 코인 단위 정산에서는 소수점이 생기지 않도록 작가 몫을 내림 처리하고,
  // 남는 1코인 이하 차이는 플랫폼 몫으로 귀속해 총액을 보존한다.
  const creatorAmount = Math.floor((paidCoinRevenue * BRAND.creatorSharePct) / 100)
  const platformAmount = paidCoinRevenue - creatorAmount

  return {
    creatorAmount,
    platformAmount,
  }
}

export function buildSettlementTotals(input: {
  totalPurchases: number
  grossRevenueCoins: number
  paidCoinRevenue: number
  freeCoinRevenue: number
}): SettlementTotals {
  const amounts = calculateSettlementAmounts(input.paidCoinRevenue)

  return {
    totalPurchases: input.totalPurchases,
    grossRevenueCoins: input.grossRevenueCoins,
    paidCoinRevenue: input.paidCoinRevenue,
    freeCoinRevenue: input.freeCoinRevenue,
    creatorAmount: amounts.creatorAmount,
    platformAmount: amounts.platformAmount,
  }
}
