import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildGuardianProfileMetadata,
  buildMinorGuardianConsentRecord,
  GUARDIAN_CONSENT_VERSION,
} from '../src/lib/minor-guardian-consent.ts'

test('buildGuardianProfileMetadata uses the profile trigger keys expected by Supabase', () => {
  assert.deepEqual(
    buildGuardianProfileMetadata({
      ageBand: 'under_14',
      guardianConsentStatus: 'pending',
      requestedAt: '2026-05-04T00:00:00.000Z',
    }),
    {
      user_age_band: 'under_14',
      user_guardian_consent_status: 'pending',
      user_guardian_consent_requested_at: '2026-05-04T00:00:00.000Z',
    }
  )
})

test('buildMinorGuardianConsentRecord normalizes guardian fields and default verification data', () => {
  const record = buildMinorGuardianConsentRecord(
    'user-123',
    {
      guardianName: '  보호자 이름  ',
      guardianEmail: '  GUARDIAN@EXAMPLE.COM ',
      guardianPhone: ' 010-1234-5678 ',
      guardianRelationship: '  부모 ',
    },
    '2026-05-04T01:02:03.000Z'
  )

  assert.deepEqual(record, {
    user_id: 'user-123',
    consent_version: GUARDIAN_CONSENT_VERSION,
    guardian_name: '보호자 이름',
    guardian_email: 'guardian@example.com',
    guardian_phone: '010-1234-5678',
    guardian_relationship: '부모',
    status: 'pending',
    verification_channel: 'phone',
    verification_note: '향후 PASS/통신사 본인인증 연동 예정',
    requested_at: '2026-05-04T01:02:03.000Z',
    updated_at: '2026-05-04T01:02:03.000Z',
  })
})
