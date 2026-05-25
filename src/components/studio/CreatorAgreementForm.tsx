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
import { BRAND } from '@/lib/brand'
import { getPayoutMethodLabel } from '@/lib/webtoon'

const initialCreatorAgreementState = {
  error: null,
}
const payoutMethodOptions = ['bank_transfer', 'paypal'] as const

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
      {pending ? 'Bottega를 준비하는 중...' : '동의하고 Bottega 열기'}
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
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Open Bottega</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
            {displayName}님, Bottega를 열기 전에 기본 동의를 확인해 주세요
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
            Bottega는 창작 권리, 정산 기준, 운영 책임을 확인한 뒤 개인 My Bottega로 이어지는 개설 단계입니다.
            필요한 문서는 항목별로 나누어 읽을 수 있게 정리해 두었으니, 확인한 뒤 장르별 작업실을 열어 주세요.
          </p>
          <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs tracking-[0.2em] text-zinc-400">
            버전 {CREATOR_AGREEMENT_VERSION}
          </div>
        </section>

        <section className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Required Agreements</p>
            <h2 className="text-2xl font-bold tracking-tight text-white">Bottega 개설 동의</h2>
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
              필수 동의 항목에 모두 동의해야 Bottega를 열 수 있습니다.
            </p>
          ) : null}

        </section>

        <section className="grid gap-5 rounded-[32px] border border-emerald-400/20 bg-emerald-500/5 p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Settlement Profile</p>
            <h2 className="text-2xl font-bold tracking-tight text-white">작가 정산 설정</h2>
            <p className="text-sm leading-6 text-zinc-300">
              정산 설정은 작품마다 반복 입력하지 않고 작가 계정에 한 번 저장됩니다. 일반 정산 분배는 작가{' '}
              {BRAND.creatorSharePct}% / 회사 {BRAND.platformSharePct}%로 고정됩니다.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-zinc-300">
              <span>정산 분배</span>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white">
                작가 {BRAND.creatorSharePct}% / 회사 {BRAND.platformSharePct}%
              </div>
            </label>

            <label className="grid gap-2 text-sm text-zinc-300">
              <span>최소 정산 금액 (원)</span>
              <input
                type="number"
                min={1000}
                step={1000}
                name="minPayoutAmount"
                defaultValue={10000}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-zinc-300">
            <span>정산 방식</span>
            <select
              name="payoutMethod"
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
            >
              <option value="">아직 미정</option>
              {payoutMethodOptions.map((option) => (
                <option key={option} value={option}>
                  {getPayoutMethodLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-zinc-300">
              <span>은행명</span>
              <input
                name="bankName"
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="국민은행"
              />
            </label>

            <label className="grid gap-2 text-sm text-zinc-300">
              <span>예금주</span>
              <input
                name="accountHolder"
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="홍길동"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-zinc-300">
            <span>계좌번호</span>
            <input
              name="accountNumber"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
              placeholder="12345678901234"
            />
          </label>

          <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-5 text-zinc-400">
            계좌 정보는 서버에서 암호화해 저장합니다. 아직 정산 정보를 확정하지 못했다면 방식은 미정으로 두고 Bottega를 먼저 열 수 있습니다.
          </p>
        </section>

        {state.error ? (
          <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton canSubmit={allChecked} />
          <p className="text-sm leading-6 text-zinc-500">
            동의 기록과 작가 정산 설정은 Bottega 개설 단계에서 저장되며, 일반 회원가입 약관과는 별도로 관리됩니다.
          </p>
        </div>
      </form>

      <PolicyViewerModal document={viewerDocument} onClose={() => setViewerDocument(null)} />
    </>
  )
}
