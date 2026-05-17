import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInternalPath } from '@/lib/guest-policy'
import { buildSignupConfirmationEmail } from '@/lib/server/signup-confirmation-email'
import { sendSmtpMail } from '@/lib/server/smtp-mailer'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type ResendSignupCodeRequestBody = {
  email?: unknown
  nextPath?: unknown
}

function getReadableResendErrorMessage(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase()

  if (normalizedMessage.includes('invalid') && normalizedMessage.includes('email')) {
    return '이메일 형식을 확인해 주세요.'
  }

  if (normalizedMessage.includes('smtp')) {
    return '인증 메일 발송 설정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }

  return '인증코드를 다시 보내지 못했습니다. 이메일을 확인한 뒤 잠시 후 다시 시도해 주세요.'
}

export async function POST(request: NextRequest) {
  let body: ResendSignupCodeRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '요청 정보를 확인하지 못했습니다.' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const nextPath = sanitizeInternalPath(
    typeof body.nextPath === 'string' ? body.nextPath : null,
    '/main'
  )

  if (!email) {
    return NextResponse.json(
      { error: '인증코드를 받을 이메일을 입력해 주세요.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const redirectTo = `${request.nextUrl.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
  const requestedAt = Date.now()
  const generated = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo,
    },
  })

  if (generated.error) {
    return NextResponse.json(
      { error: getReadableResendErrorMessage(generated.error.message) },
      { status: generated.error.status ?? 400 }
    )
  }

  if (!generated.data.properties?.email_otp) {
    return NextResponse.json(
      { error: '인증코드를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    )
  }

  try {
    const { data: consentRecord, error: consentError } = await admin
      .from('user_terms_consents')
      .select('id')
      .eq('user_id', generated.data.user.id)
      .limit(1)
      .maybeSingle()

    if (consentError) {
      throw new Error(consentError.message || '약관 동의 기록을 확인하지 못했습니다.')
    }

    if (!consentRecord) {
      const createdAt = Date.parse(generated.data.user.created_at)

      if (Number.isFinite(createdAt) && createdAt >= requestedAt - 60_000) {
        await admin.auth.admin.deleteUser(generated.data.user.id).catch(() => null)
      }

      return NextResponse.json({ ok: true, email })
    }

    const confirmationEmail = buildSignupConfirmationEmail({
      displayName: '회원',
      otp: generated.data.properties.email_otp,
    })

    await sendSmtpMail({
      to: email,
      ...confirmationEmail,
    })

    return NextResponse.json({ ok: true, email })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: getReadableResendErrorMessage(message) },
      { status: 500 }
    )
  }
}
