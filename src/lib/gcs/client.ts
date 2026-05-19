import 'server-only'
import { Storage } from '@google-cloud/storage'
import { getProductionRequiredServerEnv } from '@/lib/env/server'

const bucketName = getProductionRequiredServerEnv('GCS_BUCKET_NAME', 'inderverse-images')

// GCS 클라이언트 설정.
// 환경 변수로 설정된 정보를 바탕으로 초기화합니다.
export const storage = new Storage({
  projectId: getProductionRequiredServerEnv('GCS_PROJECT_ID'),
  credentials: {
    client_email: getProductionRequiredServerEnv('GCS_CLIENT_EMAIL'),
    // 줄바꿈 문자를 처리하기 위해 환경변수로 받을 때 replace 필수
    private_key: getProductionRequiredServerEnv('GCS_PRIVATE_KEY').replace(/\\n/g, '\n'),
  },
})

export const bucket = storage.bucket(bucketName)
