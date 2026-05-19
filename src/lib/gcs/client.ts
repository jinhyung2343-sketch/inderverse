import 'server-only'
import { Storage, type Bucket } from '@google-cloud/storage'
import { getProductionRequiredServerEnv } from '@/lib/env/server'

let storageClient: Storage | null = null
let bucketClient: Bucket | null = null

export function getGcsBucketName() {
  return getProductionRequiredServerEnv('GCS_BUCKET_NAME', 'inderverse-images')
}

export function getGcsStorage() {
  if (!storageClient) {
    storageClient = new Storage({
      projectId: getProductionRequiredServerEnv('GCS_PROJECT_ID'),
      credentials: {
        client_email: getProductionRequiredServerEnv('GCS_CLIENT_EMAIL'),
        // 줄바꿈 문자를 처리하기 위해 환경변수로 받을 때 replace 필수
        private_key: getProductionRequiredServerEnv('GCS_PRIVATE_KEY').replace(/\\n/g, '\n'),
      },
    })
  }

  return storageClient
}

export function getGcsBucket() {
  if (!bucketClient) {
    bucketClient = getGcsStorage().bucket(getGcsBucketName())
  }

  return bucketClient
}
