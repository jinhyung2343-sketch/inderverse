import 'server-only'

type RequiredServerEnv =
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'BANK_INFO_ENCRYPTION_SECRET'
  | 'AGE_VERIFICATION_STATE_SECRET'
  | 'NEXT_PUBLIC_SITE_URL'

export function requireServerEnv(name: RequiredServerEnv) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`)
  }

  return value
}

export function getOptionalServerEnv(name: string) {
  return process.env[name]?.trim() || ''
}

export function getProductionRequiredServerEnv(name: RequiredServerEnv, developmentFallback = '') {
  const value = process.env[name]?.trim()

  if (value) {
    return value
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} 환경 변수가 production에서 필요합니다.`)
  }

  return developmentFallback
}

export function getSiteUrl() {
  return getProductionRequiredServerEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').replace(/\/$/, '')
}
