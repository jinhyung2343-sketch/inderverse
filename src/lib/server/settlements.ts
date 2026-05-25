import 'server-only'

import { buildSettlementTotals, type SettlementTotals } from '@/lib/settlement'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type ChannelRow = Pick<
  Database['public']['Tables']['channels']['Row'],
  'id' | 'title' | 'status'
>

type EpisodeRow = Pick<
  Database['public']['Tables']['episodes']['Row'],
  'id' | 'channel_id'
>

type PurchaseRow = Pick<
  Database['public']['Tables']['purchases']['Row'],
  'episode_id' | 'coin_amount' | 'paid_coin_used' | 'free_coin_used' | 'purchased_at'
>

type SettlementRow = Pick<
  Database['public']['Tables']['settlements']['Row'],
  | 'id'
  | 'channel_id'
  | 'creator_id'
  | 'period_start'
  | 'period_end'
  | 'total_purchases'
  | 'gross_revenue_coins'
  | 'paid_coin_revenue'
  | 'free_coin_revenue'
  | 'creator_amount'
  | 'platform_amount'
  | 'creator_share_pct_snapshot'
  | 'status'
  | 'paid_at'
  | 'created_at'
>

export interface CreatorSettlementPeriodSummary {
  label: string
  startDate: string
  endDateExclusive: string
  totals: SettlementTotals
}

export interface CreatorSettlementChannelSummary extends SettlementTotals {
  channelId: string
  title: string
  status: Database['public']['Enums']['channel_status']
}

export interface CreatorSettlementSnapshot extends SettlementTotals {
  id: string
  channelId: string
  channelTitle: string
  periodStart: string
  periodEnd: string
  creatorSharePctSnapshot: number
  status: Database['public']['Enums']['settlement_status']
  paidAt: string | null
  createdAt: string
}

export interface CreatorSettlementDashboard {
  currentPeriod: CreatorSettlementPeriodSummary
  channelSummaries: CreatorSettlementChannelSummary[]
  recentSnapshots: CreatorSettlementSnapshot[]
}

function getCurrentKstPeriod() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())

  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0')
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1')
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1

  return {
    label: `${year}년 ${month}월`,
    startDate: `${year}-${String(month).padStart(2, '0')}-01`,
    endDateExclusive: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`,
  }
}

function emptyDashboard(): CreatorSettlementDashboard {
  const period = getCurrentKstPeriod()
  const totals = buildSettlementTotals({
    totalPurchases: 0,
    grossRevenueCoins: 0,
    paidCoinRevenue: 0,
    freeCoinRevenue: 0,
  })

  return {
    currentPeriod: {
      label: period.label,
      startDate: period.startDate,
      endDateExclusive: period.endDateExclusive,
      totals,
    },
    channelSummaries: [],
    recentSnapshots: [],
  }
}

export async function getCreatorSettlementDashboard(): Promise<CreatorSettlementDashboard> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return emptyDashboard()
  }

  const admin = createAdminClient()
  const period = getCurrentKstPeriod()

  const channelsResult = await admin
    .from('channels')
    .select('id, title, status')
    .eq('creator_id', user.id)
    .in('work_type', ['webtoon', 'novel', 'audio_drama', 'music', 'illustration', 'essay', 'other'])
    .order('updated_at', { ascending: false })

  if (channelsResult.error) {
    throw new Error(`Failed to load settlement channels: ${channelsResult.error.message}`)
  }

  const channels = (channelsResult.data ?? []) as ChannelRow[]

  if (channels.length === 0) {
    return emptyDashboard()
  }

  const channelIds = channels.map((channel) => channel.id)
  const episodesResult = await admin
    .from('episodes')
    .select('id, channel_id')
    .in('channel_id', channelIds)

  if (episodesResult.error) {
    throw new Error(`Failed to load settlement episodes: ${episodesResult.error.message}`)
  }

  const episodes = (episodesResult.data ?? []) as EpisodeRow[]
  const episodeIds = episodes.map((episode) => episode.id)
  const purchasesResult = episodeIds.length
    ? await admin
        .from('purchases')
        .select('episode_id, coin_amount, paid_coin_used, free_coin_used, purchased_at')
        .in('episode_id', episodeIds)
        .gte('purchased_at', `${period.startDate}T00:00:00+09:00`)
        .lt('purchased_at', `${period.endDateExclusive}T00:00:00+09:00`)
    : { data: [], error: null }

  if (purchasesResult.error) {
    throw new Error(`Failed to load settlement purchases: ${purchasesResult.error.message}`)
  }

  const settlementsResult = await admin
    .from('settlements')
    .select(
      'id, channel_id, creator_id, period_start, period_end, total_purchases, gross_revenue_coins, paid_coin_revenue, free_coin_revenue, creator_amount, platform_amount, creator_share_pct_snapshot, status, paid_at, created_at'
    )
    .eq('creator_id', user.id)
    .order('period_end', { ascending: false })
    .limit(12)

  if (settlementsResult.error) {
    throw new Error(`Failed to load settlements: ${settlementsResult.error.message}`)
  }

  const episodeChannelMap = new Map(episodes.map((episode) => [episode.id, episode.channel_id]))
  const channelSummaryMap = new Map<string, CreatorSettlementChannelSummary>(
    channels.map((channel) => [
      channel.id,
      {
        channelId: channel.id,
        title: channel.title,
        status: channel.status,
        totalPurchases: 0,
        grossRevenueCoins: 0,
        paidCoinRevenue: 0,
        freeCoinRevenue: 0,
        creatorAmount: 0,
        platformAmount: 0,
      },
    ])
  )

  ;((purchasesResult.data ?? []) as PurchaseRow[]).forEach((purchase) => {
    const channelId = episodeChannelMap.get(purchase.episode_id)

    if (!channelId) {
      return
    }

    const summary = channelSummaryMap.get(channelId)

    if (!summary) {
      return
    }

    summary.totalPurchases += 1
    summary.grossRevenueCoins += purchase.coin_amount
    summary.paidCoinRevenue += purchase.paid_coin_used
    summary.freeCoinRevenue += purchase.free_coin_used

    const totals = buildSettlementTotals(summary)
    summary.creatorAmount = totals.creatorAmount
    summary.platformAmount = totals.platformAmount
  })

  const channelSummaries = Array.from(channelSummaryMap.values()).sort((left, right) => {
    if (right.paidCoinRevenue !== left.paidCoinRevenue) {
      return right.paidCoinRevenue - left.paidCoinRevenue
    }

    return left.title.localeCompare(right.title, 'ko')
  })

  const currentPeriodTotals = buildSettlementTotals(
    channelSummaries.reduce(
      (acc, channel) => ({
        totalPurchases: acc.totalPurchases + channel.totalPurchases,
        grossRevenueCoins: acc.grossRevenueCoins + channel.grossRevenueCoins,
        paidCoinRevenue: acc.paidCoinRevenue + channel.paidCoinRevenue,
        freeCoinRevenue: acc.freeCoinRevenue + channel.freeCoinRevenue,
      }),
      {
        totalPurchases: 0,
        grossRevenueCoins: 0,
        paidCoinRevenue: 0,
        freeCoinRevenue: 0,
      }
    )
  )

  const channelTitleMap = new Map(channels.map((channel) => [channel.id, channel.title]))
  const recentSnapshots = ((settlementsResult.data ?? []) as SettlementRow[]).map((settlement) => ({
    id: settlement.id,
    channelId: settlement.channel_id,
    channelTitle: channelTitleMap.get(settlement.channel_id) ?? '채널',
    periodStart: settlement.period_start,
    periodEnd: settlement.period_end,
    totalPurchases: settlement.total_purchases,
    grossRevenueCoins: settlement.gross_revenue_coins,
    paidCoinRevenue: settlement.paid_coin_revenue,
    freeCoinRevenue: settlement.free_coin_revenue,
    creatorAmount: settlement.creator_amount,
    platformAmount: settlement.platform_amount,
    creatorSharePctSnapshot: settlement.creator_share_pct_snapshot,
    status: settlement.status,
    paidAt: settlement.paid_at,
    createdAt: settlement.created_at,
  }))

  return {
    currentPeriod: {
      label: period.label,
      startDate: period.startDate,
      endDateExclusive: period.endDateExclusive,
      totals: currentPeriodTotals,
    },
    channelSummaries,
    recentSnapshots,
  }
}
