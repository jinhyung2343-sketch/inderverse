'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { PolicyViewerModal } from '@/components/auth/PolicyViewerModal'
import {
  CREATOR_AGREEMENT_VERSION,
  creatorAgreementDocuments,
  requiredCreatorAgreementConsentItems,
} from '@/lib/creator-agreement'
import { acceptCreatorAgreement } from '@/app/main/studio/actions'

const initialCreatorAgreementState = {
  error: null,
}

function getInitialConsentValues() {
  return requiredCreatorAgreementConsentItems.reduce<Record<string, boolean>>((acc, item) => {
    acc[item.fieldName] = false
    return acc
  }, {})
}

function SubmitButton({
  canSubmit,
}: {
  canSubmit: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={!canSubmit || pending}
      className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? '작가 등록을 준비하는 중...' : '동의하고 작가 등록 진행'}
    </button>
  )
}

function ConsentRow({
  checked,
  fieldName,
  label,
  onToggle,
  onView,
}: {
  checked: boolean
  fieldName: string
  label: string
  onToggle: () => void
  onView: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-zinc-200">
        <input
          type="checkbox"
          name={fieldName}
          checked={checked}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
        />
        <span>{label}</span>
      </label>

      <button
        type="button"
        onClick={onView}
        className="inline-flex shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10"
      >
        보기
      </button>
    </div>
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
  const [consents, setConsents] = useState(getInitialConsentValues)
  const [viewerDocument, setViewerDocument] = useState<(typeof creatorAgreementDocuments)[string] | null>(
    null
  )

  const allChecked = requiredCreatorAgreementConsentItems.every((item) => consents[item.fieldName])

  const toggleConsent = (fieldName: string) => {
    setConsents((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }))
  }

  const toggleAllConsents = () => {
    const nextValue = !allChecked

    setConsents(
      requiredCreatorAgreementConsentItems.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.fieldName] = nextValue
        return acc
      }, {})
    )
  }

  const openPolicy = (documentId: string) => {
    setViewerDocument(creatorAgreementDocuments[documentId] ?? null)
  }

  return (
    <>
      <form action={formAction} className="grid gap-6">
        <section className="rounded-[32px] border border-emerald-400/20 bg-emerald-500/5 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Creator Agreement</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
            {displayName}님, 작가 등록 전에 기본 동의를 확인해 주세요
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
            작가 등록은 창작 권리, 정산 기준, 운영 책임이 함께 시작되는 단계입니다. 필요한 문서는
            항목별로 나누어 읽을 수 있게 정리해 두었으니, 차분히 확인한 뒤 진행해 주세요.
          </p>
          <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs tracking-[0.2em] text-zinc-400">
            버전 {CREATOR_AGREEMENT_VERSION}
          </div>
        </section>

        <section className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Required Agreements</p>
            <h2 className="text-2xl font-bold tracking-tight text-white">작가 등록 동의</h2>
            <p className="text-sm leading-6 text-zinc-400">
              필수 항목을 분리해 보여드려요. 필요한 정책은 바로 열어보고, 확인이 끝난 항목부터 차례로
              동의할 수 있습니다.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-50">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAllConsents}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
            />
            <span>
              전체 동의
              <span className="mt-1 block text-xs leading-5 text-emerald-100/80">
                아래 필수 동의 항목 4개를 한 번에 체크합니다.
              </span>
            </span>
          </label>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">필수 동의 항목</p>
            <div className="grid gap-3">
              {requiredCreatorAgreementConsentItems.map((item) => (
                <ConsentRow
                  key={item.key}
                  checked={consents[item.fieldName]}
                  fieldName={item.fieldName}
                  label={item.label}
                  onToggle={() => toggleConsent(item.fieldName)}
                  onView={() => openPolicy(item.documentId)}
                />
              ))}
            </div>
          </div>

          {!allChecked ? (
            <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              필수 동의 항목에 모두 동의해야 작가 등록을 진행할 수 있습니다.
            </p>
          ) : null}

          {state.error ? (
            <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton canSubmit={allChecked} />
            <p className="text-sm leading-6 text-zinc-500">
              동의 기록은 작가 등록 단계에서만 저장되며, 일반 회원가입 약관과는 별도로 관리됩니다.
            </p>
          </div>
        </section>
      </form>

      <PolicyViewerModal document={viewerDocument} onClose={() => setViewerDocument(null)} />
    </>
  )
}
