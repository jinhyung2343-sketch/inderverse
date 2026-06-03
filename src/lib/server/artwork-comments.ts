import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/types'

type ArtworkCommentRow = Pick<
  Database['public']['Tables']['artwork_comments']['Row'],
  'id' | 'channel_id' | 'user_id' | 'body' | 'status' | 'created_at' | 'updated_at'
>

type ProfileSummaryRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'display_name' | 'avatar_url'
>

export interface PublicArtworkComment {
  id: string
  channelId: string
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  body: string
  createdAt: string
}

export interface PublicArtworkCommentsResult {
  comments: PublicArtworkComment[]
  isReady: boolean
}

export const ARTWORK_COMMENT_MAX_LENGTH = 500

export function normalizeArtworkCommentBody(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.replace(/\r\n/g, '\n').trim()
}

export function isValidArtworkCommentBody(body: string) {
  return body.length > 0 && body.length <= ARTWORK_COMMENT_MAX_LENGTH
}

function isArtworkCommentsSchemaUnavailable(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false
  }

  const message = error.message ?? ''

  return error.code === '42P01' || message.includes('artwork_comments')
}

export async function getPublicArtworkComments(channelId: string, limit = 30): Promise<PublicArtworkCommentsResult> {
  const admin = createAdminClient()
  const commentsResult = await admin
    .from('artwork_comments')
    .select('id, channel_id, user_id, body, status, created_at, updated_at')
    .eq('channel_id', channelId)
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (commentsResult.error) {
    if (isArtworkCommentsSchemaUnavailable(commentsResult.error)) {
      return {
        comments: [],
        isReady: false,
      }
    }

    throw new Error(`Failed to load artwork comments: ${commentsResult.error.message}`)
  }

  const comments = (commentsResult.data ?? []) as ArtworkCommentRow[]
  const authorIds = Array.from(new Set(comments.map((comment) => comment.user_id)))

  const profilesResult = authorIds.length > 0
    ? await admin
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', authorIds)
    : { data: [], error: null }

  if (profilesResult.error) {
    throw new Error(`Failed to load artwork comment authors: ${profilesResult.error.message}`)
  }

  const profilesById = new Map(
    ((profilesResult.data ?? []) as ProfileSummaryRow[]).map((profile) => [profile.id, profile])
  )

  return {
    comments: comments
      .map<PublicArtworkComment>((comment) => {
        const profile = profilesById.get(comment.user_id)

        return {
          id: comment.id,
          channelId: comment.channel_id,
          authorId: comment.user_id,
          authorName: profile?.display_name?.trim() || '독자',
          authorAvatarUrl: profile?.avatar_url ?? null,
          body: comment.body,
          createdAt: comment.created_at,
        }
      })
      .reverse(),
    isReady: true,
  }
}

export async function createArtworkComment({
  channelId,
  userId,
  body,
}: {
  channelId: string
  userId: string
  body: string
}) {
  const admin = createAdminClient()
  const result = await admin
    .from('artwork_comments')
    .insert({
      channel_id: channelId,
      user_id: userId,
      body,
      status: 'visible',
    })
    .select('id')
    .single()

  if (result.error) {
    if (isArtworkCommentsSchemaUnavailable(result.error)) {
      throw new Error('댓글 저장소가 아직 준비되지 않았습니다.')
    }

    throw new Error(`Failed to create artwork comment: ${result.error.message}`)
  }

  return result.data.id
}
