import { bucket } from './client'

export type AllowedContentType = 'image/png' | 'image/jpeg' | 'image/webp'

export async function generateSignedUrl({
  channelId,
  episodeId,
  sortOrder,
  contentType,
}: {
  channelId: string
  episodeId: string
  sortOrder: number
  contentType: AllowedContentType
}) {
  const extension = contentType.split('/')[1]
  const filePath = `originals/${channelId}/${episodeId}/${sortOrder}.${extension}`
  
  const [url] = await bucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15분
    contentType: contentType, // Content-Type 잠금
    extensionHeaders: {
      'x-goog-content-length-range': '1,20971520', // 최대 20MB
    },
  })

  return { url, filePath }
}
