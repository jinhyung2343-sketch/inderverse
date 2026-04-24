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

    const { amount, paymentProvider, idempotencyKey } = await req.json()

    if (process.env.ENABLE_DEV_COIN_CHARGE !== 'true') {
      return NextResponse.json(
        {
          error: 'Coin charge is disabled until server-side payment verification is implemented.',
        },
        { status: 503 }
      )
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid idempotency key' }, { status: 400 })
    }

    if (paymentProvider !== undefined && typeof paymentProvider !== 'string') {
      return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 })
    }

    // 결제 검증 연동 전까지는 개발 환경에서만 제한적으로 사용한다.
    const adminClient = createAdminClient()

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

    const newPaidBalance = wallet.paid_balance + amount

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
        balance_after: newPaidBalance + wallet.free_balance,
        payment_provider: paymentProvider,
        idempotency_key: idempotencyKey,
        description: '개발용 유료 코인 충전'
      })

    return NextResponse.json({ success: true, balance: newPaidBalance }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error charging coins:', message)
    return NextResponse.json({ error: 'Charge failed' }, { status: 500 })
  }
}
