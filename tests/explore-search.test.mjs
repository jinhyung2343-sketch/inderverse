import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getHangulInitials,
  matchesSearchQuery,
} from '../src/lib/search.ts'

test('getHangulInitials extracts Korean initial consonants', () => {
  assert.equal(getHangulInitials('고등어 가리비 골고루'), 'ㄱㄷㅇ ㄱㄹㅂ ㄱㄱㄹ')
  assert.equal(getHangulInitials('Inderverse 고등어'), 'inderverse ㄱㄷㅇ')
})

test('matchesSearchQuery supports full Korean text and choseong searches', () => {
  const values = ['고등어 작가', '바다 판타지']

  assert.equal(matchesSearchQuery('고등', values), true)
  assert.equal(matchesSearchQuery('ㄱ', values), true)
  assert.equal(matchesSearchQuery('고ㄷ', values), true)
  assert.equal(matchesSearchQuery('바ㄷ', values), true)
  assert.equal(matchesSearchQuery('ㄱㄷ', values), false)
  assert.equal(matchesSearchQuery('ㅂㄷ', values), false)
  assert.equal(matchesSearchQuery('ㄴㄴ', values), false)
})

test('matchesSearchQuery keeps latin slug and spacing searches working', () => {
  const values = ['Blue Archive', 'creator-slug']

  assert.equal(matchesSearchQuery('blue', values), true)
  assert.equal(matchesSearchQuery('creator', values), true)
  assert.equal(matchesSearchQuery('bluearchive', values), true)
})
