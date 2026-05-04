import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildRatingChecklistJson,
  DEFAULT_RATING_CHECKLIST,
  getSuggestedAgeRating,
  isAgeRatingAtLeast,
  sanitizeRatingChecklist,
} from '../src/lib/content-rating.ts'

test('sanitizeRatingChecklist falls back to defaults for invalid input', () => {
  assert.deepEqual(sanitizeRatingChecklist(null), DEFAULT_RATING_CHECKLIST)
  assert.deepEqual(sanitizeRatingChecklist([]), DEFAULT_RATING_CHECKLIST)
  assert.deepEqual(
    sanitizeRatingChecklist({
      sexualContent: 'medium',
      violence: 'unexpected',
      language: 'low',
    }),
    {
      sexualContent: 'medium',
      violence: 'none',
      language: 'low',
    }
  )
})

test('getSuggestedAgeRating escalates to the highest required age band', () => {
  assert.equal(getSuggestedAgeRating(DEFAULT_RATING_CHECKLIST), 'all')
  assert.equal(
    getSuggestedAgeRating({
      sexualContent: 'low',
      violence: 'none',
      language: 'none',
    }),
    '12'
  )
  assert.equal(
    getSuggestedAgeRating({
      sexualContent: 'none',
      violence: 'medium',
      language: 'low',
    }),
    '15'
  )
  assert.equal(
    getSuggestedAgeRating({
      sexualContent: 'high',
      violence: 'none',
      language: 'none',
    }),
    '19'
  )
})

test('isAgeRatingAtLeast compares age ratings in ascending order', () => {
  assert.equal(isAgeRatingAtLeast('19', '15'), true)
  assert.equal(isAgeRatingAtLeast('15', '19'), false)
  assert.equal(isAgeRatingAtLeast('12', '12'), true)
})

test('buildRatingChecklistJson preserves normalized checklist values', () => {
  assert.deepEqual(
    buildRatingChecklistJson({
      sexualContent: 'low',
      violence: 'medium',
      language: 'none',
    }),
    {
      sexualContent: 'low',
      violence: 'medium',
      language: 'none',
    }
  )
})
