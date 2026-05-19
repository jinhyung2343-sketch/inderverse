import { spawnSync } from 'node:child_process'

const requiredTrackedFiles = [
  'README.md',
  '.github/workflows/release-gate.yml',
  'docs/deployment-production.md',
  'docs/production-env.template',
  'next.config.ts',
  'package.json',
  'scripts/check-production-database.mjs',
  'scripts/check-production-readiness.mjs',
  'scripts/generate-production-secrets.mjs',
  'scripts/release-gate.mjs',
  'scripts/check-release-files.mjs',
  'src/lib/bottega.ts',
  'src/lib/env/public.ts',
  'src/lib/env/server.ts',
  'src/app/main/studio/channels/novel/page.tsx',
  'src/components/studio/CreatorRegistrationCancelPanel.tsx',
  'supabase/migrations/050_creator_channel_primary_bottega.sql',
]

const intentionallyUntracked = new Set([
  'inderverse.code-workspace',
])

function runGit(args) {
  return spawnSync('git', args, {
    encoding: 'utf8',
  })
}

const missingFromGit = []

for (const file of requiredTrackedFiles) {
  const result = runGit(['ls-files', '--error-unmatch', file])

  if (result.status !== 0) {
    missingFromGit.push(file)
  }
}

const status = runGit(['status', '--short'])
const untracked = status.stdout
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.startsWith('?? '))
  .map((line) => line.slice(3).trim())
  .filter((file) => !intentionallyUntracked.has(file))

if (missingFromGit.length > 0 || untracked.length > 0) {
  console.error('Release files check failed:')

  if (missingFromGit.length > 0) {
    console.error('')
    console.error('Required release files are not tracked by git:')

    for (const file of missingFromGit) {
      console.error(`- ${file}`)
    }
  }

  if (untracked.length > 0) {
    console.error('')
    console.error('Unexpected untracked files are present:')

    for (const file of untracked) {
      console.error(`- ${file}`)
    }
  }

  console.error('')
  console.error('Stage and commit required files before deploying from git.')
  process.exit(1)
}

console.log('Release files check passed.')
