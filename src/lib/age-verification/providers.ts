import { AgeVerificationProvider, VerificationProviderConfig } from './types'

const callbackPath = '/api/age-verification/complete'

export const verificationProviders: Record<AgeVerificationProvider, VerificationProviderConfig> = {
  pass: {
    provider: 'pass',
    label: 'PASS 본인인증',
    mode: 'redirect',
    externalStartUrl: process.env.PASS_VERIFY_START_URL,
    callbackPath,
    requiresProviderSignature: true,
    instructions:
      '운영 환경에서는 PASS 인증 시작 URL과 결과 서명을 검증해야 합니다. 현재는 콜백 규격을 붙이기 위한 확장 골격까지 준비된 상태입니다.',
  },
  phone: {
    provider: 'phone',
    label: '휴대폰 본인인증',
    mode: 'redirect',
    externalStartUrl: process.env.PHONE_VERIFY_START_URL,
    callbackPath,
    requiresProviderSignature: true,
    instructions:
      '통신사/대행사 기반 휴대폰 인증 플로우를 같은 콜백 구조에 연결할 수 있도록 준비해둡니다.',
  },
  manual: {
    provider: 'manual',
    label: '운영자 확인',
    mode: 'manual',
    callbackPath,
    instructions:
      '개발 및 운영 예외 케이스를 위한 수동 확인 플로우입니다. 프로덕션에서는 내부 도구 또는 백오피스에서만 허용하는 것을 권장합니다.',
  },
}

export function getVerificationProvider(provider: AgeVerificationProvider) {
  return verificationProviders[provider]
}
