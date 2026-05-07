import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  isDevManualAgeVerificationEnabled,
  parseVerificationState,
  recordAdultVerification,
  verifyProviderResultSignature,
} from '@/lib/age-verification/service'
import { getVerificationProvider } from '@/lib/age-verification/providers'
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
  const verificationState = body.verificationState
  const approved = body.approved === true
  const ciHash = typeof body.ciHash === 'string' ? body.ciHash : undefined
  const providerSignature =
    typeof body.providerSignature === 'string' ? body.providerSignature : req.headers.get('x-provider-signature') ?? undefined

  if (!isProvider(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  if (typeof verificationState !== 'string' || verificationState.length === 0) {
    return NextResponse.json({ error: 'Missing verification state' }, { status: 400 })
  }

  if (!approved) {
    return NextResponse.json({ error: 'Verification was not approved' }, { status: 400 })
  }

  let parsedState: ReturnType<typeof parseVerificationState>

  try {
    parsedState = parseVerificationState(verificationState)
  } catch {
    return NextResponse.json({ error: 'Invalid or tampered verification state' }, { status: 400 })
  }

  const providerConfig = getVerificationProvider(provider)

  if (parsedState.userId !== user.id || parsedState.provider !== provider) {
    return NextResponse.json({ error: 'Verification state mismatch' }, { status: 403 })
  }

  if (provider === 'manual') {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Manual verification is disabled in production' }, { status: 403 })
    }

    if (!isDevManualAgeVerificationEnabled()) {
      return NextResponse.json(
        { error: 'Manual verification is disabled until explicitly enabled for development' },
        { status: 403 }
      )
    }
  }

  if (providerConfig.requiresProviderSignature) {
    if (!ciHash) {
      return NextResponse.json(
        { error: 'Provider result is missing required identity hash' },
        { status: 400 }
      )
    }

    const isValidProviderResult = verifyProviderResultSignature({
      provider,
      verificationState,
      approved,
      ciHash,
      signature: providerSignature,
    })

    if (!isValidProviderResult) {
      return NextResponse.json({ error: 'Invalid provider verification signature' }, { status: 403 })
    }
  }

  const result = await recordAdultVerification({
    userId: user.id,
    provider,
    ciHash: ciHash ?? `dev-${provider}-${user.id}`,
  })

  return NextResponse.json({
    success: true,
    provider,
    returnUrl: parsedState.returnUrl ?? '/main/studio/safety',
    ...result,
  })
}
