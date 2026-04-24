import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { episodeId } = await req.json()
    const adminClient = createAdminClient()

    // 1. 중복 구매 확인 (이미 구매한 에피소드인가?)
    const { data: prevPurchase } = await adminClient
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('episode_id', episodeId)
      .single()

    if (prevPurchase) {
      return NextResponse.json({ message: 'Already purchased' }, { status: 200 })
    }

    // 2. 에피소드 가격 확인
    const { data: episode } = await adminClient
      .from('episodes')
      .select('coin_price, channel_id')
      .eq('id', episodeId)
      .single()

    if (!episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    if (episode.coin_price === 0) return NextResponse.json({ error: 'Free episode' }, { status: 400 })

    // 3. 지갑 잔액 확인
    const { data: wallet } = await adminClient
      .from('coin_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

    const totalBalance = wallet.paid_balance + wallet.free_balance
    if (totalBalance < episode.coin_price) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 402 })
    }

    // 4. 코인 차감 로직 (무료 코인 먼저 사용)
    let freeUsed = 0
    let paidUsed = 0
    let remainingPrice = episode.coin_price

    if (wallet.free_balance >= remainingPrice) {
      freeUsed = remainingPrice
      remainingPrice = 0
    } else {
      freeUsed = wallet.free_balance
      remainingPrice -= freeUsed
      paidUsed = remainingPrice
    }

    // 프로덕션: 위 계산을 토대로 RPC에서 원자적 트랜잭션 처리 권장
    
    // 지갑 잔액 차감
    await adminClient
      .from('coin_wallets')
      .update({
        free_balance: wallet.free_balance - freeUsed,
        paid_balance: wallet.paid_balance - paidUsed
      })
      .eq('id', wallet.id)

    // 구매 내역 생성
    const { data: purchaseData } = await adminClient
      .from('purchases')
      .insert({
        user_id: user.id,
        episode_id: episodeId,
        coin_amount: episode.coin_price,
        paid_coin_used: paidUsed,
        free_coin_used: freeUsed
      })
      .select()
      .single()

    // 원장 기록
    await adminClient
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        type: 'use',
        coin_type: freeUsed > 0 ? 'free' : 'paid',
        amount: -episode.coin_price,
        balance_after: totalBalance - episode.coin_price,
        reference_id: purchaseData!.id,
        description: '에피소드 열람'
      })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error purchasing episode:', error)
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 })
  }
}
