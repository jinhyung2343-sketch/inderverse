# inderverse

`inderverse`는 거대 플랫폼의 종속성에서 벗어나 작가에게 더 큰 주도권과 명확한 70:30 정산 구조를 제공하는 독립 창작 플랫폼 프로토타입입니다.

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase Auth / Database / Storage
- Google Cloud Storage signed upload + 후처리 훅
- Serwist 기반 PWA

## Current Focus

- 작가/독자 통합 프로필, 채널, 에피소드, 코인, 구매, 정산 데이터 모델
- 성인물 태그 및 연령 게이트를 포함한 안전한 표현 자유 구조
- 채널별 정산 정보와 지급 기준 관리
- GCS 원본 업로드와 CDN 서빙 구조 준비

## Main Areas

- `/main/explore`: 작품 탐색 경험 초안
- `/main/studio`: 채널, 정산, 안전장치 중심의 작가 스튜디오 골격
- `/main/store`: 코인/결제 구조 설명
- `/main/library`: 구매 및 해금 기반 개인 라이브러리 초안

## Local Development

```bash
npm run lint
npm run build
```

Supabase 로컬 스택을 사용한다면 프로젝트 루트의 `supabase/` 디렉터리 설정을 기준으로 실행합니다.

### 실제 비밀번호 재설정 메일 테스트

로컬 Supabase에서도 가입한 이메일로 비밀번호 재설정 인증코드를 실제 발송하려면 SMTP 환경 변수를 `.env.local` 또는 `supabase/.env.local`에 설정한 뒤 Supabase 로컬 스택을 재시작해야 합니다.

```env
INDERVERSE_SMTP_HOST=smtp.resend.com
INDERVERSE_SMTP_USER=resend
INDERVERSE_SMTP_PASS=your-resend-api-key
INDERVERSE_SMTP_FROM_EMAIL=no-reply@your-verified-domain.com
INDERVERSE_SMTP_FROM_NAME=Inderverse
```

```bash
npm run supabase:start:mail
```

비밀번호 재설정 메일은 로컬 메일함이 아니라 Resend SMTP를 통해 실제 가입 이메일 주소로 발송됩니다. 입력한 이메일이 현재 연결된 Supabase 프로젝트에 가입되어 있어야 메일이 발송됩니다.

## Production Auth Deployment

인터넷 배포 환경에서 회원가입, 이메일 인증, 비밀번호 재설정, 회원 탈퇴가 정상 동작하려면 배포 프로젝트에 아래 환경 변수가 설정되어 있어야 합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
INDERVERSE_SMTP_HOST=
INDERVERSE_SMTP_USER=
INDERVERSE_SMTP_PASS=
INDERVERSE_SMTP_FROM_EMAIL=
INDERVERSE_SMTP_FROM_NAME=
```

Supabase Auth URL Configuration에는 운영 도메인을 Site URL로 설정하고, Additional Redirect URLs에 아래 경로를 허용해야 합니다.

```text
https://your-domain.com/auth/callback
https://your-domain.com/auth/reset-password
https://your-domain.com/auth/verify-email
```

Vercel Preview 배포에서 인증 링크를 테스트한다면 Supabase Additional Redirect URLs에 Vercel preview URL 패턴도 추가해야 합니다. 운영 도메인은 와일드카드보다 정확한 경로를 우선 사용합니다.

## Notes

- PASS/휴대폰 본인인증은 실제 외부 연동 전 단계의 확장 가능한 API 골격까지 연결되어 있습니다.
- 코인 충전은 서버 측 PG 결제 검증이 구현될 때까지 production 기능이 아닙니다. 현재 상태와 해제 조건은 `docs/architecture/monetization-roadmap.md`를 기준으로 관리합니다.
- 플랫폼 내 일반 정산 수익 분배는 `작가 70% / 회사 30%`로 고정합니다.
- 성인 인증 이력은 `age_verifications`, 노출 제한은 `profiles.is_adult_verified` 및 콘텐츠 플래그로 관리합니다.
- Vercel Cron 인증은 공식 `CRON_SECRET` Bearer 헤더 포맷과 맞춰져 있습니다. Storage cleanup 및 webtoon image processing 내부 작업은 `Authorization: Bearer ${CRON_SECRET}` 또는 전용 내부 secret으로 보호합니다.
- 복수 계정 허용 정책과 향후 서버 확장 메모는 `docs/policies/multi-account-policy.md`에 정리되어 있습니다.
- 서버 기반 계정 그룹 설계는 `docs/architecture/server-account-groups.md`와 `supabase/migrations/044_account_groups.sql`을 기준으로 확장합니다.
