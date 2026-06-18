import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveStoredDisplayName } from '../src/lib/auth/display-name.ts'

test('stored display name prefers metadata when profile is an email fallback', () => {
  assert.equal(
    resolveStoredDisplayName({
      email: 'dream@example.com',
      metadataDisplayName: '꿈과 희망',
      profileDisplayName: 'dream',
    }),
    '꿈과 희망'
  )
})

test('stored display name keeps explicit profile names across devices', () => {
  assert.equal(
    resolveStoredDisplayName({
      email: 'dream@example.com',
      metadataDisplayName: 'dream',
      profileDisplayName: '꿈과 희망',
    }),
    '꿈과 희망'
  )
})
