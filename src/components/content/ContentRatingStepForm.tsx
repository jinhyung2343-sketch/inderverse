'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { ContentRatingActionState } from '@/app/main/studio/channels/actions'
import { ContentRatingFieldset } from '@/components/content/ContentRatingFieldset'
import type { ChannelAgeRating, RatingChecklist } from '@/lib/content-rating'
import type { WorkType } from '@/lib/work'

const initialActionState: ContentRatingActionState = { error: null }

function RatingSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? '저장 중...' : label}
    </button>
  )
}

export function ContentRatingStepForm({
  action,
  channelId,
  workType,
  title,
  ageRating,
  ratingChecklist,
  backHref,
  nextPath,
  submitLabel = '등급 저장하고 계속하기',
}: {
  action: (
    previousState: ContentRatingActionState,
    formData: FormData
  ) => ContentRatingActionState | Promise<ContentRatingActionState>
  channelId: string
  workType: WorkType
  title: string
  ageRating: ChannelAgeRating
  ratingChecklist: RatingChecklist
  backHref: string
  nextPath: string
  submitLabel?: string
}) {
  const [state, formAction] = useActionState(action, initialActionState)

  return (
    <form action={formAction} className="grid gap-6">
      <input type="hidden" name="channelId" value={channelId} />
      <input type="hidden" name="workType" value={workType} />
      <input type="hidden" name="nextPath" value={nextPath} />

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Rating Step</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
            작품의 노출 범위와 성인 인증 여부를 먼저 고정하는 단계입니다. 체크리스트 기준과 실제 선택 등급이
            맞는지 확인한 뒤 다음 편집 단계로 넘어갈 수 있습니다.
          </p>
        </div>
      </section>

      <ContentRatingFieldset
        initialAgeRating={ageRating}
        initialChecklist={ratingChecklist}
        sectionTitle="등급 분류 설정"
      />

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        {state.error ? (
          <div className="mb-5 rounded-3xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
            {state.error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <RatingSubmitButton label={submitLabel} />
          <Link
            href={backHref}
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            이전 단계로
          </Link>
        </div>
      </section>
    </form>
  )
}
