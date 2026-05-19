import { randomBytes } from 'node:crypto'

const secrets = [
  {
    name: 'AGE_VERIFICATION_STATE_SECRET',
    note: 'Signs age-verification state payloads.',
  },
  {
    name: 'AGE_VERIFICATION_PROVIDER_SECRET',
    note: 'Verifies external age-verification callback signatures.',
  },
  {
    name: 'CRON_SECRET',
    note: 'Bearer token used by scheduled internal jobs.',
  },
  {
    name: 'STORAGE_CLEANUP_SECRET',
    note: 'Optional dedicated token for storage cleanup jobs.',
  },
  {
    name: 'WEBTOON_IMAGE_PROCESSING_SECRET',
    note: 'Optional dedicated token for webtoon image processing jobs.',
  },
  {
    name: 'INTERNAL_JOB_SECRET',
    note: 'Optional shared token for internal jobs.',
  },
  {
    name: 'BANK_INFO_ENCRYPTION_SECRET',
    note: 'Encrypts settlement bank info. Do not rotate without a re-encryption plan.',
  },
]

function createSecret() {
  return randomBytes(48).toString('base64url')
}

console.log('# Generated production secrets')
console.log('# Put these in the production hosting provider. Do not commit real values.')
console.log('')

for (const secret of secrets) {
  console.log(`# ${secret.note}`)
  console.log(`${secret.name}=${createSecret()}`)
  console.log('')
}
