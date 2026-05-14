import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendSmtpMail } from '@/lib/server/smtp-mailer'
import { buildWelcomeEmail } from '@/lib/server/welcome-email'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  if (!user.email || !user.email_confirmed_at) {
    return NextResponse.json({ error: '이메일 인증이 완료되지 않았습니다.' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  const metadataDisplayName =
    typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name.trim()
      : ''
  const displayName =
    profile?.display_name?.trim() || metadataDisplayName || user.email.split('@')[0] || '회원'

  const { data: existingDelivery, error: existingDeliveryError } = await admin
    .from('welcome_email_deliveries')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingDeliveryError) {
    return NextResponse.json({ error: '환영 메일 발송 상태를 확인하지 못했습니다.' }, { status: 500 })
  }

  if (existingDelivery?.status === 'sent' || existingDelivery?.status === 'pending') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const now = new Date().toISOString()

  if (existingDelivery?.id) {
    const { error } = await admin
      .from('welcome_email_deliveries')
      .update({
        email: user.email,
        display_name: displayName,
        status: 'pending',
        error_message: null,
        updated_at: now,
      })
      .eq('id', existingDelivery.id)

    if (error) {
      return NextResponse.json({ error: '환영 메일 발송 상태를 저장하지 못했습니다.' }, { status: 500 })
    }
  } else {
    const { error } = await admin.from('welcome_email_deliveries').insert({
      user_id: user.id,
      email: user.email,
      display_name: displayName,
      status: 'pending',
      updated_at: now,
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, skipped: true })
      }

      return NextResponse.json({ error: '환영 메일 발송 상태를 저장하지 못했습니다.' }, { status: 500 })
    }
  }

  try {
    const welcomeEmail = buildWelcomeEmail({ displayName })

    await sendSmtpMail({
      to: user.email,
      ...welcomeEmail,
    })

    await admin
      .from('welcome_email_deliveries')
      .update({
        status: 'sent',
        error_message: null,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    await admin
      .from('welcome_email_deliveries')
      .update({
        status: 'failed',
        error_message: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return NextResponse.json({ error: '환영 메일을 발송하지 못했습니다.' }, { status: 500 })
  }
}
