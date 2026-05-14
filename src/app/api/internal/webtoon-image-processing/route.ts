import { NextRequest, NextResponse } from 'next/server'
import {
  getWebtoonImageProcessingSecret,
  isAuthorizedWebtoonImageProcessingRequest,
  runWebtoonImageProcessingJobs,
} from '@/lib/server/webtoon-image-processing'

export const runtime = 'nodejs'

function getLimitFromRequest(req: NextRequest) {
  const searchLimit = req.nextUrl.searchParams.get('limit')
  const parsed = searchLimit ? Number.parseInt(searchLimit, 10) : 10

  return Number.isInteger(parsed) ? parsed : 10
}

function isAuthorized(req: NextRequest) {
  return isAuthorizedWebtoonImageProcessingRequest({
    authorization: req.headers.get('authorization'),
    internalSecret: req.headers.get('x-inderverse-job-secret'),
  })
}

async function handleProcessingRequest(req: NextRequest) {
  if (!getWebtoonImageProcessingSecret()) {
    return NextResponse.json(
      { error: 'Webtoon image processing secret is not configured.' },
      { status: 503 }
    )
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runWebtoonImageProcessingJobs(getLimitFromRequest(req))
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webtoon image processing failed'
    console.error('Webtoon image processing job failed:', message)
    return NextResponse.json({ error: 'Webtoon image processing failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return handleProcessingRequest(req)
}

export async function POST(req: NextRequest) {
  return handleProcessingRequest(req)
}
