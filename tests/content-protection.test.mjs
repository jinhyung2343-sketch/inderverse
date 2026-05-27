import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CONTENT_PROTECTION_VERSION,
  buildReaderWatermark,
  getProtectedContentResponseHeaders,
  getProtectedImageUrl,
  getReaderViewerLabel,
} from '../src/lib/content-protection.ts'

test('reader watermark keeps viewer identity short and traceable', () => {
  assert.equal(CONTENT_PROTECTION_VERSION, 'reader-protection-v1')
  assert.equal(getReaderViewerLabel({ viewerId: '1234567890abcdef' }), 'user:12345678')
  assert.equal(getReaderViewerLabel({ viewerLabel: 'creator-preview' }), 'creator-preview')
  assert.equal(getReaderViewerLabel({}), 'guest')
  assert.equal(
    buildReaderWatermark({
      artworkId: 'art-1',
      episodeId: 'episode-2',
      viewerId: '1234567890abcdef',
    }),
    'Inderverse · user:12345678 · art-1/episode-2'
  )
})

test('protected image urls keep the current public image path until the private route is enabled', () => {
  assert.equal(
    getProtectedImageUrl({
      artworkId: 'art-1',
      episodeId: 'episode-2',
      imageUrl: 'https://cdn.example.com/public/page-1.webp',
      index: 0,
    }),
    'https://cdn.example.com/public/page-1.webp'
  )
})

test('protected content response headers are ready for the future image route', () => {
  assert.deepEqual(getProtectedContentResponseHeaders(), {
    'Cache-Control': 'private, no-store, max-age=0',
    'Referrer-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
  })
})
