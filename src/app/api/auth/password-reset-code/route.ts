import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInternalPath } from '@/lib/guest-policy'
import { buildPasswordResetEmail } from '@/lib/server/password-reset-email'
import { sendSmtpMail } from '@/lib/server/smtp-mailer'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type PasswordResetCodeRequestBody = {
  email?: unknown
  nextPath?: unknown
}

function isMissingUserError(message: string) {
  const normalizedMessage = message.toLowerCase()

  return (
    normalizedMessage.includes('user not found') ||
    normalizedMessage.includes('not found') ||
    normalizedMessage.includes('does not exist')
  )
}

function getReadablePasswordResetErrorMessage(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase()

  if (normalizedMessage.includes('invalid') && normalizedMessage.includes('email')) {
    return '이메일 형식을 확인해 주세요.'
  }

  if (normalizedMessage.includes('smtp')) {
    return '인증 메일 발송 설정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }

  return '인증코드 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

export async function POST(request: NextRequest) {
  let body: PasswordResetCodeRequestBody

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
  const redirectTo = `${request.nextUrl.origin}/auth/reset-password?next=${encodeURIComponent(nextPath)}`

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo,
      },
    })

    if (error) {
      if (isMissingUserError(error.message)) {
        return NextResponse.json({ ok: true, email })
      }

      return NextResponse.json(
        { error: getReadablePasswordResetErrorMessage(error.message) },
        { status: error.status ?? 400 }
      )
    }

    if (!data.properties?.email_otp) {
      return NextResponse.json(
        { error: '인증코드를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 500 }
      )
    }

    const resetEmail = buildPasswordResetEmail({
      otp: data.properties.email_otp,
    })

    await sendSmtpMail({
      to: email,
      ...resetEmail,
    })

    return NextResponse.json({ ok: true, email })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: getReadablePasswordResetErrorMessage(message) },
      { status: 500 }
    )
  }
}
