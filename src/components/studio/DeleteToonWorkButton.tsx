'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  deleteToonWorkWithState,
  type DeleteToonWorkActionState,
} from '@/app/main/studio/channels/actions'

const initialState: DeleteToonWorkActionState = { error: null }

function DeleteButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex rounded-full border border-rose-300/25 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? '삭제 중...' : '삭제'}
    </button>
  )
}

export function DeleteToonWorkButton({
  channelId,
  title,
  workType,
}: {
  channelId: string
  title: string
  workType: 'webtoon' | 'spark'
}) {
  const [state, formAction] = useActionState(deleteToonWorkWithState, initialState)

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `"${title}" 작품을 삭제할까요? 삭제하면 작품 정보와 연결된 회차 데이터가 함께 삭제됩니다.`
        )

        if (!confirmed) {
          event.preventDefault()
        }
      }}
      className="flex flex-col items-start gap-2 md:items-end"
    >
      <input type="hidden" name="channelId" value={channelId} />
      <input type="hidden" name="workType" value={workType} />
      <DeleteButton />
      {state.error ? <p className="max-w-48 text-xs leading-5 text-rose-200">{state.error}</p> : null}
    </form>
  )
}
