import { Storage } from '@google-cloud/storage'

// GCS 클라이언트 설정. 
// 환경 변수로 설정된 정보를 바탕으로 초기화합니다.
export const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    // 줄바꿈 문자를 처리하기 위해 환경변수로 받을 때 replace 필수
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
})

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || 'indetune-images')
