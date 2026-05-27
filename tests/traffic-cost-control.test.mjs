import assert from 'node:assert/strict'
import test from 'node:test'

import {
  TRAFFIC_COST_GUARD_VERSION,
  TRAFFIC_COST_LIMITS,
  buildTrafficCostHeaders,
  getTrafficCostMode,
  getTrafficCostProfileForPath,
  getTrafficEmergencyDecision,
  getUploadBudgetDecision,
} from '../src/lib/traffic-cost-control.ts'

test('traffic cost mode is opt-in through the emergency environment flag', () => {
  assert.equal(getTrafficCostMode({}), 'normal')
  assert.equal(getTrafficCostMode({ TRAFFIC_COST_EMERGENCY_MODE: 'enabled' }), 'emergency')
})

test('traffic cost profiles classify expensive upload routes separately', () => {
  assert.equal(getTrafficCostProfileForPath('/api/upload/signed-url'), 'creatorUpload')
  assert.equal(getTrafficCostProfileForPath('/api/internal/webtoon-image-processing'), 'creatorUpload')
  assert.equal(getTrafficCostProfileForPath('/api/auth/sign-in'), 'privateApi')
  assert.equal(getTrafficCostProfileForPath('/main/explore'), 'publicCatalog')
})

test('emergency mode blocks creator upload routes without blocking ordinary private APIs', () => {
  assert.deepEqual(getTrafficEmergencyDecision('/api/auth/sign-in', {
    TRAFFIC_COST_EMERGENCY_MODE: 'enabled',
  }), { type: 'allow' })

  assert.deepEqual(getTrafficEmergencyDecision('/api/upload/signed-url', {
    TRAFFIC_COST_EMERGENCY_MODE: 'enabled',
  }), {
    type: 'block',
    message: 'Traffic cost emergency mode is limiting creator uploads temporarily.',
    profile: 'creatorUpload',
    retryAfterSeconds: TRAFFIC_COST_LIMITS.emergencyRetryAfterSeconds,
    status: 503,
  })
})

test('upload budget guard blocks requests above the configured image limit', () => {
  assert.deepEqual(getUploadBudgetDecision(TRAFFIC_COST_LIMITS.maxImageUploadBytes), { type: 'allow' })
  assert.deepEqual(getUploadBudgetDecision(TRAFFIC_COST_LIMITS.maxImageUploadBytes + 1), {
    type: 'block',
    maxBytes: TRAFFIC_COST_LIMITS.maxImageUploadBytes,
    status: 413,
  })
})

test('traffic cost headers expose a stable guard marker and optional cache policy', () => {
  assert.deepEqual(buildTrafficCostHeaders('creatorUpload'), {
    'X-Inderverse-Cost-Guard': TRAFFIC_COST_GUARD_VERSION,
    'X-Inderverse-Cost-Profile': 'creatorUpload',
  })

  assert.equal(
    buildTrafficCostHeaders('privateApi', { includeCacheControl: true })['Cache-Control'],
    'no-store, max-age=0, must-revalidate'
  )
})
