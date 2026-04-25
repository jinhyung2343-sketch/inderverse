import { Storage } from '@google-cloud/storage'

// Cloud Function이 GCS 이벤트(객체 생성) 발생 시 호출할 진입점입니다.
// 실제 배포 시에는 GCP Cloud Functions 환경에서 동작합니다.
// 예시 구현체입니다. 실제환경에서는 sharp나 DB연결 설정이 추가로 필요가능.

type GcsFinalizeEvent = {
  bucket: string
  name: string
}

const storage = new Storage()
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 이 함수는 Cloud Function (event-driven) 으로 배포되어 동작함을 가정합니다.
export const imageOptimizer = async (event: GcsFinalizeEvent) => {
  const file = storage.bucket(event.bucket).file(event.name)

  // 1. 파일 경로 필터링 (originals 폴더에 올라온 것만 처리)
  if (!event.name.startsWith('originals/')) return

  // 2. 파일 헤더 다운로드 및 검증 (최소 12바이트)
  const [buffer] = await file.download({ start: 0, end: 12 })
  if (!isValidImageHeader(buffer)) {
    console.error(`Invalid magic bytes for file ${event.name}, deleting...`)
    await file.delete()
    return
  }

  // 3. (실제 환경) sharp를 이용한 최적화 과정 (720w, 1080w, 1440w WebP 변환) 추가
  // const fileBuffer = await file.download();
  // for (const width of [720, 1080, 1440]) { ... }

  // 4. Supabase DB 상태 업데이트 (is_verified = true)
  const fetch = (await import('node-fetch')).default
  const updatePayload = { is_verified: true }

  const response = await fetch(`${supabaseUrl}/rest/v1/episode_images?image_url=eq.${encodeURIComponent(event.name)}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(updatePayload)
  })

  if (!response.ok) {
    console.error(`Failed to update DB for ${event.name}`)
  } else {
    console.log(`Successfully verified and updated DB for ${event.name}`)
  }
}

function isValidImageHeader(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 8) return false
  const hex = buffer.toString('hex', 0, 8).toUpperCase()
  if (hex.startsWith('FFD8FF') || hex.startsWith('89504E47')) return true
  if (hex.startsWith('52494646') && buffer.length >= 12 && buffer.toString('utf8', 8, 12) === 'WEBP') return true
  return false
}
