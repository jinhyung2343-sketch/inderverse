import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

function loadEnvFile(filename) {
  const filePath = resolve(root, filename)

  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] ??= value
  }
}

loadEnvFile('.env')
loadEnvFile('.env.local')
loadEnvFile('.env.production')
loadEnvFile('.env.production.local')

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'INDERVERSE_SMTP_HOST',
  'INDERVERSE_SMTP_USER',
  'INDERVERSE_SMTP_PASS',
  'INDERVERSE_SMTP_FROM_EMAIL',
  'INDERVERSE_SMTP_FROM_NAME',
  'GCS_PROJECT_ID',
  'GCS_BUCKET_NAME',
  'GCS_CLIENT_EMAIL',
  'GCS_PRIVATE_KEY',
  'NEXT_PUBLIC_CDN_URL',
  'AGE_VERIFICATION_STATE_SECRET',
  'AGE_VERIFICATION_PROVIDER_SECRET',
  'CRON_SECRET',
  'BANK_INFO_ENCRYPTION_SECRET',
]

const urlEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_CDN_URL',
  'PASS_VERIFY_START_URL',
  'PHONE_VERIFY_START_URL',
]

const longSecretEnv = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'AGE_VERIFICATION_STATE_SECRET',
  'AGE_VERIFICATION_PROVIDER_SECRET',
  'CRON_SECRET',
  'BANK_INFO_ENCRYPTION_SECRET',
]

const requiredFiles = [
  'src/lib/bottega.ts',
  'src/app/main/studio/channels/novel/page.tsx',
  'src/components/studio/CreatorRegistrationCancelPanel.tsx',
  'supabase/migrations/050_creator_channel_primary_bottega.sql',
]

const errors = []
const warnings = []

function readEnv(name) {
  return process.env[name]?.trim() ?? ''
}

for (const name of requiredEnv) {
  const value = readEnv(name)

  if (!value) {
    errors.push(`${name} is missing`)
  } else if (/^(your-|replace-with-|https:\/\/your-|no-reply@your-)/.test(value) || value.includes('example.com')) {
    errors.push(`${name} still contains a placeholder value`)
  }
}

for (const name of urlEnv) {
  const value = readEnv(name)

  if (!value) {
    continue
  }

  try {
    const url = new URL(value)

    if (name !== 'NEXT_PUBLIC_SITE_URL' && name !== 'NEXT_PUBLIC_CDN_URL') {
      continue
    }

    if (url.protocol !== 'https:') {
      errors.push(`${name} must use https in production`)
    }
  } catch {
    errors.push(`${name} must be a valid URL`)
  }
}

for (const name of longSecretEnv) {
  const value = readEnv(name)

  if (value && value.length < 32) {
    errors.push(`${name} should be at least 32 characters`)
  }
}

if (readEnv('ENABLE_DEV_MANUAL_AGE_VERIFICATION') === 'true') {
  errors.push('ENABLE_DEV_MANUAL_AGE_VERIFICATION must not be true in production')
}

if (readEnv('ENABLE_DEV_COIN_CHARGE') === 'true') {
  errors.push('ENABLE_DEV_COIN_CHARGE must not be true in production')
}

if (!readEnv('PASS_VERIFY_START_URL') && !readEnv('PHONE_VERIFY_START_URL')) {
  errors.push('At least one external age verification start URL must be configured')
}

if (!readEnv('STORAGE_CLEANUP_SECRET') && !readEnv('CRON_SECRET') && !readEnv('INTERNAL_JOB_SECRET')) {
  errors.push('At least one storage cleanup job secret must be configured')
}

if (!readEnv('WEBTOON_IMAGE_PROCESSING_SECRET') && !readEnv('CRON_SECRET') && !readEnv('INTERNAL_JOB_SECRET')) {
  errors.push('At least one webtoon image processing job secret must be configured')
}

for (const filename of requiredFiles) {
  if (!existsSync(resolve(root, filename))) {
    errors.push(`${filename} is missing`)
  }
}

const migration = readFileSync(resolve(root, 'supabase/migrations/050_creator_channel_primary_bottega.sql'), 'utf8')

if (!migration.includes('primary_work_type')) {
  errors.push('migration 050 does not add primary_work_type')
}

if (!migration.includes("NOTIFY pgrst, 'reload schema'")) {
  errors.push('migration 050 must reload the PostgREST schema cache')
}

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`)
}

if (errors.length > 0) {
  console.error('Production readiness check failed:')

  for (const error of errors) {
    console.error(`- ${error}`)
  }

  process.exit(1)
}

console.log('Production readiness check passed.')
