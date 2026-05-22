import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const envPath = resolve(root, '.env.local')

function randomLocalSecret(name) {
  return `local_${name.toLowerCase()}_${randomBytes(24).toString('base64url')}`
}

function parseKeys(lines) {
  const keys = new Set()

  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/)

    if (match) {
      keys.add(match[1])
    }
  }

  return keys
}

function upsertEnv(lines, key, value, { overwrite = false } = {}) {
  const index = lines.findIndex((line) => line.startsWith(`${key}=`))

  if (index >= 0) {
    if (overwrite) {
      lines[index] = `${key}=${value}`
      return 'updated'
    }

    return 'kept'
  }

  lines.push(`${key}=${value}`)
  return 'added'
}

const lines = existsSync(envPath)
  ? readFileSync(envPath, 'utf8').split(/\r?\n/)
  : []

while (lines.length > 0 && lines.at(-1) === '') {
  lines.pop()
}

const keysBefore = parseKeys(lines)
const changes = []

if (!keysBefore.has('NEXT_PUBLIC_SITE_URL')) {
  lines.push('')
  lines.push('# Local app URL')
  changes.push(['NEXT_PUBLIC_SITE_URL', upsertEnv(lines, 'NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')])
}

lines.push('')
lines.push('# Local billing test switches')
changes.push(['ENABLE_DEV_COIN_CHARGE', upsertEnv(lines, 'ENABLE_DEV_COIN_CHARGE', 'true', { overwrite: true })])
changes.push([
  'ENABLE_DEV_SUBSCRIPTION_CHECKOUT',
  upsertEnv(lines, 'ENABLE_DEV_SUBSCRIPTION_CHECKOUT', 'true', { overwrite: true }),
])

const secretDefaults = [
  'CRON_SECRET',
  'STORAGE_CLEANUP_SECRET',
  'WEBTOON_IMAGE_PROCESSING_SECRET',
  'INTERNAL_JOB_SECRET',
  'BANK_INFO_ENCRYPTION_SECRET',
  'AGE_VERIFICATION_STATE_SECRET',
  'AGE_VERIFICATION_PROVIDER_SECRET',
]

const keysAfterFlags = parseKeys(lines)
const missingSecretKeys = secretDefaults.filter((key) => !keysAfterFlags.has(key))

if (missingSecretKeys.length > 0) {
  lines.push('')
  lines.push('# Local generated secrets')

  for (const key of missingSecretKeys) {
    changes.push([key, upsertEnv(lines, key, randomLocalSecret(key))])
  }
}

writeFileSync(envPath, `${lines.join('\n')}\n`)

const changed = changes.filter(([, status]) => status !== 'kept')

if (changed.length === 0) {
  console.log('Local env already had the required development settings.')
} else {
  console.log('Updated .env.local keys:')

  for (const [key, status] of changed) {
    console.log(`- ${key}: ${status}`)
  }
}
