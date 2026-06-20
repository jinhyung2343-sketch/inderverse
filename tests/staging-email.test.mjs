import assert from 'node:assert/strict'
import test from 'node:test'

import { getStagingAuthEmail, isStagingAuthEmail } from '../src/lib/auth/staging-email.ts'

test('staging auth email is separated from the public user email', () => {
  assert.equal(
    getStagingAuthEmail('dream@example.com'),
    'dream+inderverse-staging@example.com'
  )
})

test('staging auth email normalization is lowercase and idempotent', () => {
  assert.equal(
    getStagingAuthEmail('Dream+inderverse-staging@Example.COM'),
    'dream+inderverse-staging@example.com'
  )
})

test('staging auth email check rejects the production account email', () => {
  assert.equal(isStagingAuthEmail('dream@example.com'), false)
  assert.equal(isStagingAuthEmail('dream+inderverse-staging@example.com'), true)
})
