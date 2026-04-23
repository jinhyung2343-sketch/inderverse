import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, paymentProvider, idempotencyKey } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // 실제 앱에서는 여기서 아임포트/Toss/Stripe 등 결제 검증 로직 발생

    // 서비스 롤(Admin) 클라이언트를 통해 코인 원장 조작 
    const adminClient = createAdminClient()

    // 1. 중복 충전 방지 대조
    const { data: existingTx } = await adminClient
      .from('coin_transactions')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single()

    if (existingTx) {
      return NextResponse.json({ message: 'Already processed' }, { status: 200 })
    }

    // 2. 유저 지갑 조회
    const { data: wallet, error: walletError } = await adminClient
      .from('coin_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) throw new Error('Wallet not found')

    // 3. 지갑 잔액 업데이트 및 트랜잭션 기록
    const newPaidBalance = wallet.paid_balance + amount

    // (참고: 프로덕션에서는 이 과정을 Supabase RPC Transaction으로 묶어서 원자성을 보장해야 합니다)
    
    await adminClient
      .from('coin_wallets')
      .update({ paid_balance: newPaidBalance })
      .eq('id', wallet.id)

    await adminClient
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        type: 'charge',
        coin_type: 'paid',
        amount: amount,
        balance_after: newPaidBalance + wallet.free_balance, // 총 잔액 기록용이라면
        payment_provider: paymentProvider,
        idempotency_key: idempotencyKey,
        description: '유료 코인 충전'
      })

    return NextResponse.json({ success: true, balance: newPaidBalance }, { status: 200 })
  } catch (error: any) {
    console.error('Error charging coins:', error.message)
    return NextResponse.json({ error: 'Charge failed' }, { status: 500 })
  }
}
