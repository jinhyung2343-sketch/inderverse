import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInternalPath } from '@/lib/guest-policy'
import { createClient } from '@/lib/supabase/server'

type EmailLinkOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'

const emailLinkOtpTypes = new Set<EmailLinkOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

export const dynamic = 'force-dynamic'

function buildRedirect(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url))
}

function buildVerifyErrorRedirect(request: NextRequest, nextPath: string) {
  return buildRedirect(
    request,
    `/auth/verify-email?next=${encodeURIComponent(nextPath)}&error=link`
  )
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const nextPath = sanitizeInternalPath(requestUrl.searchParams.get('next'), '/main')
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const rawType = requestUrl.searchParams.get('type')
  const providerError =
    requestUrl.searchParams.get('error') || requestUrl.searchParams.get('error_code')

  if (providerError) {
    return buildVerifyErrorRedirect(request, nextPath)
  }

  if (!code && !tokenHash) {
    return buildVerifyErrorRedirect(request, nextPath)
  }

  const supabase = await createClient()
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type:
          rawType && emailLinkOtpTypes.has(rawType as EmailLinkOtpType)
            ? (rawType as EmailLinkOtpType)
            : 'signup',
      })

  if (error) {
    return buildVerifyErrorRedirect(request, nextPath)
  }

  return buildRedirect(request, nextPath)
}
