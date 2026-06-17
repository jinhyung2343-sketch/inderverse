import 'server-only'

export type AppEnvironment = 'development' | 'staging' | 'production'

function readFlag(name: string) {
  return process.env[name]?.trim() === 'true'
}

export function getAppEnvironment(): AppEnvironment {
  const value = process.env.APP_ENV?.trim().toLowerCase()

  if (process.env.VERCEL_ENV === 'preview') {
    return 'staging'
  }

  if (value === 'development' || value === 'staging' || value === 'production') {
    return value
  }

  return process.env.NODE_ENV === 'production' ? 'production' : 'development'
}

export function isStagingEnvironment() {
  return getAppEnvironment() === 'staging'
}

export function isProductionEnvironment() {
  return getAppEnvironment() === 'production'
}

export function canUseMockAgeVerification() {
  if (isStagingEnvironment()) {
    return readFlag('ENABLE_STAGING_MOCK_AGE_VERIFICATION')
  }

  return process.env.NODE_ENV !== 'production' && readFlag('ENABLE_DEV_MANUAL_AGE_VERIFICATION')
}

export function canUseMockSubscriptionCheckout() {
  if (isStagingEnvironment()) {
    return readFlag('ENABLE_STAGING_MOCK_BILLING') || readFlag('ENABLE_DEV_SUBSCRIPTION_CHECKOUT')
  }

  return process.env.NODE_ENV !== 'production'
}

export function canUseMockCoinCharge() {
  if (isStagingEnvironment()) {
    return readFlag('ENABLE_STAGING_MOCK_BILLING') || readFlag('ENABLE_DEV_COIN_CHARGE')
  }

  return process.env.NODE_ENV !== 'production' && readFlag('ENABLE_DEV_COIN_CHARGE')
}
