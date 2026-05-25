const productionEnvKeys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_SITE_URL',
  'INDERVERSE_SMTP_HOST',
  'INDERVERSE_SMTP_USER',
  'INDERVERSE_SMTP_PASS',
  'INDERVERSE_SMTP_FROM_EMAIL',
  'INDERVERSE_SMTP_FROM_NAME',
  'PASS_VERIFY_START_URL',
  'PHONE_VERIFY_START_URL',
  'AGE_VERIFICATION_STATE_SECRET',
  'AGE_VERIFICATION_PROVIDER_SECRET',
  'ENABLE_DEV_MANUAL_AGE_VERIFICATION',
  'ENABLE_DEV_COIN_CHARGE',
  'CRON_SECRET',
  'STORAGE_CLEANUP_SECRET',
  'WEBTOON_IMAGE_PROCESSING_SECRET',
  'INTERNAL_JOB_SECRET',
  'BANK_INFO_ENCRYPTION_SECRET',
]

console.log('# Vercel Production Environment Checklist')
console.log('# Add these keys in Vercel -> Project Settings -> Environment Variables -> Production.')
console.log('# This script prints keys only; it never prints secret values.')
console.log('')

for (const key of productionEnvKeys) {
  console.log(key)
}
