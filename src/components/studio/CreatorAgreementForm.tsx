'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  CREATOR_AGREEMENT_TITLE,
  CREATOR_AGREEMENT_VERSION,
  creatorAgreementSections,
} from '@/lib/creator-agreement'
import {
  acceptCreatorAgreement,
  initialCreatorAgreementState,
} from '@/app/main/studio/actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? '작가 등록을 준비하는 중...' : '동의하고 작가 등록 진행'}
    </button>
  )
}

export function CreatorAgreementForm({
  displayName,
}: {
  displayName: string
}) {
  const [state, formAction] = useActionState(
    acceptCreatorAgreement,
    initialCreatorAgreementState
  )

  return (
    <form action={formAction} className="grid gap-6">
      <section className="rounded-[32px] border border-emerald-400/20 bg-emerald-500/5 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Creator Agreement</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
          {displayName}님, 작가 등록 전에 기본 동의를 확인해 주세요
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
          인더버스는 작가의 창작 자율성과 권리를 존중하는 방향으로 설계되어 있습니다. 작가 등록 전,
          게시와 정산에 필요한 기본 원칙을 한 번 차분히 확인할 수 있도록 준비했습니다.
        </p>
        <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs tracking-[0.2em] text-zinc-400">
          버전 {CREATOR_AGREEMENT_VERSION}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Full Text</p>
          <h2 className="text-2xl font-bold tracking-tight text-white">{CREATOR_AGREEMENT_TITLE}</h2>
          <p className="text-sm leading-6 text-zinc-400">
            전문을 스크롤로 확인할 수 있으며, 이후 정책이 개정되면 버전 기준으로 다시 안내할 수 있도록
            기록 구조를 함께 준비합니다.
          </p>
        </div>

        <div className="mt-5 max-h-[32rem] overflow-y-auto rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="grid gap-6">
            {creatorAgreementSections.map((section) => (
              <section key={section.id} className="grid gap-3">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-zinc-300">
                    {paragraph}
                  </p>
                ))}
                {section.items?.length ? (
                  <ol className="grid gap-2">
                    {section.items.map((item, index) => (
                      <li key={`${section.id}-${index}`} className="text-sm leading-7 text-zinc-300">
                        {index + 1}. {item}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="grid gap-4">
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="creatorAgreementAccepted"
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
            />
            <span>[필수] 작가 등록 및 작품 게시 기본 동의서에 동의합니다.</span>
          </label>

          {state.error ? (
            <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton />
            <p className="text-sm leading-6 text-zinc-500">
              동의 기록은 작가 등록 단계에서만 저장되며, 일반 회원가입 약관과는 별도로 관리됩니다.
            </p>
          </div>
        </div>
      </section>
    </form>
  )
}
