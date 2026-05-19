import 'server-only'
import { getSiteUrl } from '@/lib/env/server'

import { BRAND } from '@/lib/brand'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildWelcomeEmail({
  displayName,
}: {
  displayName: string
}) {
  const safeName = escapeHtml(displayName)
  const subject = `${BRAND.name}에 오신 것을 환영합니다`
  const text = [
    `${displayName}님, ${BRAND.name}에 오신 것을 환영합니다.`,
    '',
    '인더버스는 작가와 독자가 직접 창작의 흐름을 만들어가는 공간입니다.',
    '작품을 둘러보고, 마음에 드는 창작자를 발견하고, 나만의 라이브러리를 채워보세요.',
    '',
    '인더버스 드림',
  ].join('\n')
  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:#050505;color:#f4f4f5;font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:1px solid rgba(255,255,255,0.12);border-radius:24px;background:#111113;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 12px;color:#a1a1aa;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;">
                  Inderverse
                </p>
                <h1 style="margin:0 0 16px;color:#ffffff;font-size:26px;line-height:1.35;">
                  ${safeName}님, 인더버스에 오신 것을 환영합니다.
                </h1>
                <p style="margin:0 0 18px;color:#d4d4d8;font-size:15px;line-height:1.8;">
                  인더버스는 작가와 독자가 직접 창작의 흐름을 만들어가는 공간입니다.
                </p>
                <p style="margin:0 0 24px;color:#d4d4d8;font-size:15px;line-height:1.8;">
                  작품을 둘러보고, 마음에 드는 창작자를 발견하고, 나만의 라이브러리를 채워보세요.
                </p>
                <a href="{{ .SiteURL }}" style="display:inline-block;border-radius:999px;background:#ffffff;color:#050505;font-size:14px;font-weight:700;padding:14px 22px;text-decoration:none;">
                  인더버스 시작하기
                </a>
                <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.7;">
                  이 메일은 회원가입 이메일 인증이 완료된 계정에 한 번 발송됩니다.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return {
    subject,
    text,
    html: html.replace('{{ .SiteURL }}', getSiteUrl()),
  }
}
