// 파일 헤더(magic bytes)를 확인하여 실제 이미지 파일인지 검증하는 유틸리티
// Signed URL을 통해 업로드하더라도 악성 코드가 섞인 파일이 들어올 수 있으므로
// 저장(또는 Cloud Function 최적화) 단계에서 실제 파일 헤더를 검증해야 합니다.

export function isValidImageHeader(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 8) return false

  const hex = buffer.toString('hex', 0, 8).toUpperCase()

  // JPEG (FFD8FFE0, FFD8FFE1, FFD8FFE2, FFD8FFE3)
  if (hex.startsWith('FFD8FF')) return true

  // PNG (89504E47)
  if (hex.startsWith('89504E47')) return true

  // WebP (RIFF....WEBP)
  if (hex.startsWith('52494646')) {
    const webpMagic = buffer.toString('utf8', 8, 12)
    if (webpMagic === 'WEBP') return true
  }

  return false
}
