import assert from 'node:assert/strict'
import test from 'node:test'

import {
  collectSupabaseAuthCookieNames,
  isSupabaseAuthCookieName,
} from '../src/lib/auth/session-cookie-names.ts'

test('supabase auth cookie cleanup includes current and legacy session keys once', () => {
  assert.equal(isSupabaseAuthCookieName('sb-project-auth-token'), true)
  assert.equal(isSupabaseAuthCookieName('my.supabase.auth.token'), true)
  assert.equal(isSupabaseAuthCookieName('inderverse:staging-mock-auth'), false)

  assert.deepEqual(
    collectSupabaseAuthCookieNames([
      { name: 'sb-project-auth-token' },
      { name: 'regular-cookie' },
      { name: 'sb-project-auth-token.0' },
      { name: 'sb-project-auth-token' },
      { name: 'legacy.supabase.auth.token' },
    ]),
    [
      'sb-project-auth-token',
      'sb-project-auth-token.0',
      'legacy.supabase.auth.token',
    ]
  )
})
