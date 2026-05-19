'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  cancelCreatorRegistration,
  type CancelCreatorRegistrationState,
} from '@/app/main/studio/creator-channel/actions'

const initialState: CancelCreatorRegistrationState = {
  error: null,
}

function ConfirmCancelButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? '삭제 중...' : '작가 등록 취소'}
    </button>
  )
}

export function CreatorRegistrationCancelPanel() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [state, formAction] = useActionState(cancelCreatorRegistration, initialState)

  return (
    <section id="creator-registration-cancel" className="rounded-lg border border-red-400/20 bg-red-500/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-200/80">Danger Zone</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">작가 등록 취소</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">
            작가 등록을 취소하면 My Bottega, 공개 프로필, 등록한 작업물과 회차 데이터가 삭제되고 일반 사용자로 돌아갑니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="inline-flex min-h-11 w-fit items-center rounded-full border border-red-300/30 bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
        >
          작가 등록 취소
        </button>
      </div>

      {state.error ? (
        <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {state.error}
        </p>
      ) : null}

      {isConfirmOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm">
          <form action={formAction} className="w-full max-w-lg rounded-lg border border-red-300/25 bg-[#101010] p-6 shadow-2xl">
            <input type="hidden" name="confirmation" value="delete-bottega" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-200/80">Confirm</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-white">작가 등록을 취소하시겠습니까?</h3>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              이 Bottega 안의 모든 자료가 삭제됩니다. 공개 프로필, 작품, 회차, 정산 설정과 저장된 작업 기록을 되돌릴 수 없습니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ConfirmCancelButton />
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.06] px-6 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                계속 유지
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}
