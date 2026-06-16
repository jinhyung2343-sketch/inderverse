import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptionPlan } from '@/lib/billing'
import { canUseMockSubscriptionCheckout, isStagingEnvironment } from '@/lib/env/app-env'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function canUseDevSubscriptionCheckout() {
  return canUseMockSubscriptionCheckout()
}

export async function POST(request: NextRequest) {
  if (!canUseDevSubscriptionCheckout()) {
    return NextResponse.json(
      { error: 'Subscription checkout is disabled until billing provider verification is implemented.' },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { action, planId } = body as {
    action?: unknown
    planId?: unknown
  }
  const admin = createAdminClient()
  const mockProvider = isStagingEnvironment() ? 'staging-mock' : 'local-dev'

  if (action === 'cancel') {
    await admin
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])

    const { error: profileError } = await admin
      .from('profiles')
      .update({ is_subscribed: false })
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json({ error: 'Unable to update subscription state' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, status: 'canceled' })
  }

  if (action !== 'activate' || typeof planId !== 'string') {
    return NextResponse.json({ error: 'Invalid subscription action' }, { status: 400 })
  }

  const plan = getSubscriptionPlan(planId)

  if (!plan) {
    return NextResponse.json({ error: 'Unknown subscription plan' }, { status: 400 })
  }

  const now = new Date()
  const periodEnd = new Date(now)

  if (plan.billingPeriod === 'annual') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  await admin
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])

  const { error: subscriptionError } = await admin
    .from('user_subscriptions')
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      provider: mockProvider,
    })

  if (subscriptionError) {
    return NextResponse.json({ error: 'Unable to create subscription state' }, { status: 500 })
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ is_subscribed: true })
    .eq('id', user.id)

  if (profileError) {
    return NextResponse.json({ error: 'Unable to update subscription state' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    status: 'active',
    planId: plan.id,
    currentPeriodEnd: periodEnd.toISOString(),
    provider: mockProvider,
  })
}
