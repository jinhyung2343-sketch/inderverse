# inderverse

`inderverse`는 거대 플랫폼의 종속성에서 벗어나 작가에게 더 큰 주도권과 더 높은 수익 배분을 제공하는 독립 창작 플랫폼 프로토타입입니다.

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase Auth / Database / Storage
- Google Cloud Storage signed upload + 후처리 훅
- Serwist 기반 PWA

## Current Focus

- 작가/독자 통합 프로필, 채널, 에피소드, 코인, 구매, 정산 데이터 모델
- 성인물 태그 및 연령 게이트를 포함한 안전한 표현 자유 구조
- 작가별 채널 수익 배분율 설정
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

## Notes

- PASS/휴대폰 본인인증은 실제 외부 연동 전 단계의 확장 가능한 API 골격까지 연결되어 있습니다.
- 수익 배분율은 채널별 `70%~80%` 범위를 기본 정책으로 둡니다.
- 성인 인증 이력은 `age_verifications`, 노출 제한은 `profiles.is_adult_verified` 및 콘텐츠 플래그로 관리합니다.
