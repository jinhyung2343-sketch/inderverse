import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const checks = [
  {
    name: 'profiles role and guardian columns',
    run: (supabase) =>
      supabase
        .from('profiles')
        .select('id, role, is_adult_verified, guardian_consent_status')
        .limit(1),
  },
  {
    name: 'creator agreement consent table',
    run: (supabase) =>
      supabase
        .from('creator_agreement_consents')
        .select('user_id, agreement_version, is_agreed, agreed_at')
        .limit(1),
  },
  {
    name: 'creator_channels primary Bottega column',
    run: (supabase) =>
      supabase
        .from('creator_channels')
        .select('id, owner_id, slug, primary_work_type, external_links, status')
        .limit(1),
  },
  {
    name: 'episode image processing columns',
    run: (supabase) =>
      supabase
        .from('episode_images')
        .select('id, processing_status, cleanup_status, original_file_path, optimized_file_path, thumbnail_file_path')
        .limit(1),
  },
  {
    name: 'storage cleanup jobs table',
    run: (supabase) =>
      supabase
        .from('storage_cleanup_jobs')
        .select('id, file_path, status, attempt_count')
        .limit(1),
  },
  {
    name: 'account group tables',
    run: (supabase) =>
      supabase
        .from('account_group_members')
        .select('id, account_group_id, user_id, member_role, status')
        .limit(1),
  },
  {
    name: 'artwork saves channel UUID schema',
    run: (supabase) =>
      supabase
        .from('artwork_saves')
        .select('user_id, artwork_id, artwork_type')
        .limit(1),
  },
]

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Production database check failed:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const failures = []

for (const check of checks) {
  const { error } = await check.run(supabase)

  if (error) {
    failures.push(`${check.name}: ${error.message}`)
  } else {
    console.log(`OK: ${check.name}`)
  }
}

if (failures.length > 0) {
  console.error('Production database check failed:')

  for (const failure of failures) {
    console.error(`- ${failure}`)
  }

  process.exit(1)
}

console.log('Production database check passed.')
