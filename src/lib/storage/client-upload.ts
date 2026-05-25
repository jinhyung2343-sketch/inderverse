'use client'

import { createClient } from '@/lib/supabase/client'

export interface SupabaseSignedUploadPayload {
  bucket: string
  filePath: string
  token: string
  publicUrl: string
}

export async function uploadToSupabaseSignedUrl(
  payload: SupabaseSignedUploadPayload,
  file: File
) {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(payload.bucket)
    .uploadToSignedUrl(payload.filePath, payload.token, file, {
      contentType: file.type,
    })

  if (error) {
    throw new Error(error.message)
  }

  return payload.publicUrl
}
