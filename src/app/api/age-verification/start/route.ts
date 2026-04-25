import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVerificationProvider } from '@/lib/age-verification/providers'
import { createVerificationState } from '@/lib/age-verification/service'
import { AgeVerificationProvider } from '@/lib/age-verification/types'

function isProvider(value: unknown): value is AgeVerificationProvider {
  return value === 'pass' || value === 'phone' || value === 'manual'
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const provider = body.provider
  const returnUrl = typeof body.returnUrl === 'string' ? body.returnUrl : '/main/studio/safety'

  if (!isProvider(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  const providerConfig = getVerificationProvider(provider)

  if (provider === 'manual' && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Manual verification is disabled in production' }, { status: 403 })
  }

  if (providerConfig.mode === 'redirect' && !providerConfig.externalStartUrl) {
    return NextResponse.json({ error: 'Verification provider is not configured' }, { status: 503 })
  }

  const verificationState = createVerificationState({
    userId: user.id,
    provider,
    returnUrl,
  })

  const callbackUrl = new URL(providerConfig.callbackPath, req.nextUrl.origin).toString()
  const redirectUrl = providerConfig.externalStartUrl
    ? `${providerConfig.externalStartUrl}?state=${encodeURIComponent(verificationState)}&redirect_uri=${encodeURIComponent(
        callbackUrl
      )}`
    : null

  return NextResponse.json({
    provider: providerConfig.provider,
    label: providerConfig.label,
    mode: providerConfig.mode,
    callbackUrl,
    redirectUrl,
    verificationState,
    isConfigured:
      (providerConfig.mode === 'manual' && process.env.NODE_ENV !== 'production') ||
      Boolean(providerConfig.externalStartUrl),
    instructions: providerConfig.instructions,
  })
}
