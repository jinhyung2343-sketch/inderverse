import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

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

    const adminClient = createAdminClient()
    const { data, error } = await adminClient.rpc('charge_coins', {
      p_user_id: user.id,
      p_amount: amount,
      p_payment_provider: paymentProvider ?? null,
      p_idempotency_key: idempotencyKey,
    })

    if (error) {
      const message = error.message || 'Charge failed'

      if (message.includes('Wallet not found')) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
      }

      if (message.includes('Invalid amount')) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
      }

      if (message.includes('Invalid idempotency key')) {
        return NextResponse.json({ error: 'Invalid idempotency key' }, { status: 400 })
      }

      throw error
    }

    if (data && typeof data === 'object' && 'status' in data && data.status === 'already_processed') {
      return NextResponse.json({ message: 'Already processed' }, { status: 200 })
    }

    return NextResponse.json({ success: true, result: data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error charging coins:', message)
    return NextResponse.json({ error: 'Charge failed' }, { status: 500 })
  }
}
