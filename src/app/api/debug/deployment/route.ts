import { NextResponse } from 'next/server'
import { getAppEnvironment } from '@/lib/env/app-env'

export const runtime = 'nodejs'

function readEnv(name: string) {
  return process.env[name]?.trim() || null
}

export async function GET() {
  return NextResponse.json(
    {
      appEnvironment: getAppEnvironment(),
      git: {
        branch: readEnv('VERCEL_GIT_COMMIT_REF'),
        commitSha: readEnv('VERCEL_GIT_COMMIT_SHA'),
        commitMessage: readEnv('VERCEL_GIT_COMMIT_MESSAGE'),
      },
      vercel: {
        environment: readEnv('VERCEL_ENV'),
        url: readEnv('VERCEL_URL'),
      },
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    }
  )
}
