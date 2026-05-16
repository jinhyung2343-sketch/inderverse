import 'server-only'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildSignupConfirmationEmail({
  displayName,
  otp,
}: {
  displayName: string
  otp: string
}) {
  const safeDisplayName = escapeHtml(displayName || '회원')
  const safeOtp = escapeHtml(otp)

  return {
    subject: '인더버스 이메일 인증 코드',
    text: [
      `${displayName || '회원'}님, 인더버스 가입을 완료하려면 아래 인증코드를 입력해 주세요.`,
      '',
      safeOtp,
      '',
      '본인이 요청하지 않았다면 이 메일을 무시해도 됩니다.',
    ].join('\n'),
    html: `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>인더버스 이메일 인증 코드</title>
  </head>
  <body style="margin:0;background:#050505;color:#f4f4f5;font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;border:1px solid rgba(255,255,255,0.12);border-radius:24px;background:#111113;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 12px;color:#a1a1aa;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;">
                  Inderverse
                </p>
                <h1 style="margin:0 0 16px;color:#ffffff;font-size:24px;line-height:1.35;">
                  이메일 인증 코드
                </h1>
                <p style="margin:0 0 24px;color:#d4d4d8;font-size:15px;line-height:1.7;">
                  ${safeDisplayName}님, 인더버스 가입을 완료하려면 아래 인증코드를 앱 화면에 입력해 주세요.
                </p>
                <p style="margin:0 0 24px;border-radius:18px;background:#ffffff;color:#050505;font-size:32px;font-weight:700;letter-spacing:0.22em;padding:18px 20px;text-align:center;">
                  ${safeOtp}
                </p>
                <p style="margin:0;color:#a1a1aa;font-size:13px;line-height:1.7;">
                  본인이 요청하지 않았다면 이 메일을 무시해도 됩니다. 인증코드는 제한 시간 이후 만료됩니다.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  }
}
