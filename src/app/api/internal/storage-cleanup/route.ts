import { NextRequest, NextResponse } from 'next/server'
import {
  getStorageCleanupSecret,
  isAuthorizedStorageCleanupRequest,
  runStorageCleanupJobs,
} from '@/lib/server/storage-cleanup'

export const runtime = 'nodejs'

function getLimitFromRequest(req: NextRequest) {
  const searchLimit = req.nextUrl.searchParams.get('limit')
  const parsed = searchLimit ? Number.parseInt(searchLimit, 10) : 25

  return Number.isInteger(parsed) ? parsed : 25
}

function isAuthorized(req: NextRequest) {
  return isAuthorizedStorageCleanupRequest({
    authorization: req.headers.get('authorization'),
    internalSecret: req.headers.get('x-inderverse-job-secret'),
  })
}

async function handleCleanupRequest(req: NextRequest) {
  if (!getStorageCleanupSecret()) {
    return NextResponse.json(
      { error: 'Storage cleanup secret is not configured.' },
      { status: 503 }
    )
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runStorageCleanupJobs(getLimitFromRequest(req))
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Storage cleanup failed'
    console.error('Storage cleanup job failed:', message)
    return NextResponse.json({ error: 'Storage cleanup failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return handleCleanupRequest(req)
}

export async function POST(req: NextRequest) {
  return handleCleanupRequest(req)
}
