'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { LOGIN_REQUIRED_MESSAGE } from '@/lib/guest-policy'
import { useAuthStore } from '@/stores/auth'

interface ArtworkComment {
  id: string
  authorName: string
  authorAvatarUrl: string | null
  body: string
  createdAt: string
}

export function ArtworkCommentsPanel({
  artworkId,
  comments,
  isCommentEnabled,
  policyNote,
  canStoreComments,
  maxLength,
}: {
  artworkId: string
  comments: ArtworkComment[]
  isCommentEnabled: boolean
  policyNote: string
  canStoreComments: boolean
  maxLength: number
}) {
  const router = useRouter()
  const { isLoggedIn, checkSession } = useAuthStore()
  const [comment, setComment] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const trimmedComment = comment.trim()
  const remainingLength = maxLength - comment.length
  const canAttemptSubmit =
    isCommentEnabled &&
    canStoreComments &&
    trimmedComment.length > 0 &&
    comment.length <= maxLength &&
    !isPending

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    []
  )

  useEffect(() => {
    checkSession()
  }, [checkSession])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isLoggedIn) {
      setFeedback(LOGIN_REQUIRED_MESSAGE)
      return
    }

    if (!canStoreComments) {
      setFeedback('이 작품은 아직 댓글 저장소와 연결되지 않았습니다.')
      return
    }

    if (!isCommentEnabled) {
      setFeedback('이 작품은 댓글이 닫혀 있습니다.')
      return
    }

    if (!trimmedComment || comment.length > maxLength) {
      setFeedback(`댓글은 1자 이상 ${maxLength}자 이하로 작성해 주세요.`)
      return
    }

    setIsPending(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/artwork-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId,
          comment: trimmedComment,
        }),
      })
      const payload = await response.json().catch(() => null) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || '댓글을 등록하지 못했습니다.')
      }

      setComment('')
      setFeedback('댓글이 등록되었습니다.')
      router.refresh()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '댓글 등록 중 문제가 발생했습니다.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="mt-5 grid gap-5">
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p className="text-sm leading-7 text-zinc-300">{policyNote}</p>
      </div>

      {isCommentEnabled && canStoreComments ? (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-3xl border border-white/10 bg-black/20 p-5">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={maxLength}
            rows={4}
            placeholder={isLoggedIn ? '댓글을 남겨 주세요.' : '로그인 후 댓글을 남길 수 있습니다.'}
            className="min-h-28 resize-y rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-500 focus:border-white/30"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={`text-xs ${remainingLength < 20 ? 'text-amber-200' : 'text-zinc-500'}`}>
              {comment.length}/{maxLength}
            </p>
            <button
              type="submit"
              disabled={!canAttemptSubmit}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? '등록 중...' : isLoggedIn ? '댓글 등록' : '로그인 필요'}
            </button>
          </div>
          {feedback ? <p className="text-sm leading-6 text-zinc-400">{feedback}</p> : null}
        </form>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-sm leading-7 text-zinc-400">
            {isCommentEnabled ? '이 작품은 아직 댓글 저장소와 연결되지 않았습니다.' : '이 작품은 댓글이 닫혀 있습니다.'}
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {comments.length > 0 ? (
          comments.map((entry) => (
            <article key={entry.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-sm font-bold text-zinc-300">
                  {entry.authorAvatarUrl ? (
                    <Image
                      src={entry.authorAvatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    entry.authorName.slice(0, 1)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{entry.authorName}</h3>
                    <time className="text-xs text-zinc-500" dateTime={entry.createdAt}>
                      {dateFormatter.format(new Date(entry.createdAt))}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{entry.body}</p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 px-5 py-8 text-center">
            <p className="text-sm text-zinc-500">아직 등록된 댓글이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
