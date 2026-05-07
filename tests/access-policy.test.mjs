import test from 'node:test'
import assert from 'node:assert/strict'

import {
  canGuestOpenMainMenu,
  getJoinPromptHref,
  getRouteAccessDecision,
  sanitizeInternalPath,
} from '../src/lib/guest-policy.ts'

test('guest main menu access is limited to public browsing areas', () => {
  assert.equal(canGuestOpenMainMenu('explore'), true)
  assert.equal(canGuestOpenMainMenu('spark'), true)
  assert.equal(canGuestOpenMainMenu('community'), true)
  assert.equal(canGuestOpenMainMenu('library'), false)
  assert.equal(canGuestOpenMainMenu('store'), false)
  assert.equal(canGuestOpenMainMenu('studio'), false)
})

test('join prompt next paths are normalized to internal routes', () => {
  assert.equal(sanitizeInternalPath('/main/library'), '/main/library')
  assert.equal(sanitizeInternalPath('//evil.example/main'), '/main')
  assert.equal(sanitizeInternalPath('https://evil.example/main'), '/main')
  assert.equal(getJoinPromptHref('/main/store?tab=charge'), '/join-prompt?next=%2Fmain%2Fstore%3Ftab%3Dcharge')
})

test('guests are redirected from account-bound main pages with return targets', () => {
  assert.deepEqual(
    getRouteAccessDecision({
      pathname: '/main/store',
      search: '?plan=basic',
      isLoggedIn: false,
    }),
    {
      type: 'redirect',
      location: '/join-prompt?next=%2Fmain%2Fstore%3Fplan%3Dbasic',
      reason: 'login_required',
    }
  )

  assert.deepEqual(
    getRouteAccessDecision({
      pathname: '/main/library',
      isLoggedIn: false,
    }),
    {
      type: 'redirect',
      location: '/join-prompt?next=%2Fmain%2Flibrary',
      reason: 'login_required',
    }
  )

  assert.deepEqual(
    getRouteAccessDecision({
      pathname: '/main/store/checkout',
      isLoggedIn: false,
    }),
    {
      type: 'redirect',
      location: '/join-prompt?next=%2Fmain%2Fstore%2Fcheckout',
      reason: 'login_required',
    }
  )
})

test('creator routes allow agreement before creator role and protect tools afterwards', () => {
  assert.deepEqual(
    getRouteAccessDecision({
      pathname: '/main/studio/creator-agreement',
      isLoggedIn: true,
      userRole: 'reader',
    }),
    { type: 'allow' }
  )

  assert.deepEqual(
    getRouteAccessDecision({
      pathname: '/main/studio/channels',
      isLoggedIn: true,
      userRole: 'reader',
    }),
    {
      type: 'redirect',
      location: '/main?denied=creator',
      reason: 'creator_required',
    }
  )

  assert.deepEqual(
    getRouteAccessDecision({
      pathname: '/main/studio/channels',
      isLoggedIn: true,
      userRole: 'creator',
    }),
    { type: 'allow' }
  )
})

test('pending guardian consent blocks store and studio but keeps the status page open', () => {
  assert.deepEqual(
    getRouteAccessDecision({
      pathname: '/main/store',
      isLoggedIn: true,
      userRole: 'reader',
      guardianConsentStatus: 'pending',
    }),
    {
      type: 'redirect',
      location: '/main/guardian-consent',
      reason: 'guardian_pending',
    }
  )

  assert.deepEqual(
    getRouteAccessDecision({
      pathname: '/main/guardian-consent',
      isLoggedIn: true,
      userRole: 'reader',
      guardianConsentStatus: 'pending',
    }),
    { type: 'allow' }
  )
})

test('auth pages and admin routes keep their expected redirects', () => {
  assert.deepEqual(
    getRouteAccessDecision({
      pathname: '/join-prompt',
      isLoggedIn: true,
      userRole: 'reader',
    }),
    {
      type: 'redirect',
      location: '/main',
      reason: 'already_logged_in',
    }
  )

  assert.deepEqual(
    getRouteAccessDecision({
      pathname: '/admin',
      isLoggedIn: true,
      userRole: 'creator',
    }),
    {
      type: 'redirect',
      location: '/main?denied=admin',
      reason: 'admin_required',
    }
  )
})
