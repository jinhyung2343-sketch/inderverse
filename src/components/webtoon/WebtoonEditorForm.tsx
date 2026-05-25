'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { WebtoonChannelActionState } from '@/app/main/studio/channels/actions'
import { BRAND } from '@/lib/brand'
import { ContentRatingFieldset } from '@/components/content/ContentRatingFieldset'
import { categories } from '@/lib/explore'
import type { CreatorWebtoonRecord } from '@/lib/webtoon'
import {
  FLEXIBLE_SERIALIZATION_LABEL,
  getPayoutMethodLabel,
  getSerializationDayLabel,
  getWebtoonStatusLabel,
  getWorkScaleLabel,
} from '@/lib/webtoon'
import { WebtoonCoverField } from '@/components/webtoon/WebtoonCoverField'

const weekdayOptions = [0, 1, 2, 3, 4, 5, 6] as const
const statusOptions = ['draft', 'publishing', 'completed'] as const
const categoryOptions = categories.filter((category) => category !== '전체')
const payoutMethodOptions = ['bank_transfer', 'paypal'] as const
const workScaleOptions = ['short', 'medium', 'long'] as const
const initialActionState: WebtoonChannelActionState = { error: null }

function SubmitButton({ label }: { label: string }) {
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

export function WebtoonEditorForm({
  action,
  initialValue,
  heading,
  description,
  submitLabel,
  channelId,
  showContentRatingFieldset = true,
}: {
  action: (
    previousState: WebtoonChannelActionState,
    formData: FormData
  ) => WebtoonChannelActionState | Promise<WebtoonChannelActionState>
  initialValue?: CreatorWebtoonRecord
  heading: string
  description: string
  submitLabel: string
  channelId?: string
  showContentRatingFieldset?: boolean
}) {
  const [state, formAction] = useActionState(action, initialActionState)

  return (
    <form action={formAction} className="grid gap-6">
      {!showContentRatingFieldset ? (
        <>
          <input type="hidden" name="ageRating" value="all" />
          <input
            type="hidden"
            name="ratingChecklistJson"
            value='{"sexualContent":"none","violence":"none","language":"none"}'
          />
          <input type="hidden" name="adultContentNoticeAccepted" value="" />
        </>
      ) : null}

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Webtoon Editor</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{heading}</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{description}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_1.85fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">기본 정보</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>작품 제목</span>
                <input
                  name="title"
                  required
                  defaultValue={initialValue?.title ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="웹툰 제목"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>작품 설명</span>
                <textarea
                  name="description"
                  required
                  defaultValue={initialValue?.description ?? ''}
                  rows={7}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="작품의 세계관, 분위기, 독자에게 먼저 보여주고 싶은 맥락을 적어주세요."
                />
              </label>

              <div className="grid gap-2 text-sm text-zinc-300">
                <span>커버 이미지</span>
                <WebtoonCoverField channelId={channelId} initialValue={initialValue?.coverImageUrl ?? ''} />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">공개 설정</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>카테고리</span>
                <select
                  name="category"
                  defaultValue={initialValue?.category ?? '드라마'}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>상태</span>
                <select
                  name="status"
                  defaultValue={initialValue?.status ?? 'draft'}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {getWebtoonStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm text-zinc-300">
              <span>탐색 태그</span>
              <input
                name="tags"
                defaultValue={
                  initialValue?.tags.filter((tag) => tag !== initialValue.category).join(', ') ?? ''
                }
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="도시환상, 군상극, 청춘"
              />
            </label>

            <div className="mt-4 grid gap-3 text-sm text-zinc-300">
              <p className="text-white">연재 요일</p>
              <label className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-4 py-2 text-emerald-50">
                <input
                  type="checkbox"
                  name="serializationDays"
                  value="flexible"
                  defaultChecked={(initialValue?.serializationDays.length ?? 0) === 0}
                  className="h-4 w-4 rounded border-white/20 bg-black/30"
                />
                <span>{FLEXIBLE_SERIALIZATION_LABEL}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {weekdayOptions.map((day) => {
                  const checked = initialValue?.serializationDays.includes(day) ?? false

                  return (
                    <label
                      key={day}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2"
                    >
                      <input
                        type="checkbox"
                        name="serializationDays"
                        value={String(day)}
                        defaultChecked={checked}
                        className="h-4 w-4 rounded border-white/20 bg-black/30"
                      />
                      <span>{getSerializationDayLabel(day)}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>작품 규모</span>
                <select
                  name="workScale"
                  defaultValue={initialValue?.workScale ?? 'medium'}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                >
                  {workScaleOptions.map((option) => (
                    <option key={option} value={option}>
                      {getWorkScaleLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>맛보기 공개 비율 (%)</span>
                <input
                  type="number"
                  min={3}
                  max={20}
                  name="teaserPercentage"
                  defaultValue={initialValue?.teaserPercentage ?? 10}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                />
              </label>
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <input
                type="checkbox"
                name="isFreeArchive"
                defaultChecked={initialValue?.isFreeArchive ?? false}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
              />
              <span>이 작품 전체를 무료 아카이브로 공개합니다.</span>
            </label>
          </div>

          {showContentRatingFieldset ? (
            <ContentRatingFieldset
              initialAgeRating={initialValue?.ageRating ?? 'all'}
              initialChecklist={initialValue?.ratingChecklist}
            />
          ) : (
            <div className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
              작품 등급은 저장 직후 이어지는 전용 단계에서 확정합니다. 지금은 기본 메타데이터와 연재 운용 기준을
              먼저 저장합니다.
            </div>
          )}

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">커뮤니티 정책</h2>
            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <input
                type="checkbox"
                name="isCommentEnabled"
                defaultChecked={initialValue?.isCommentEnabled ?? true}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
              />
              <span>이 작품의 댓글을 공개 상태로 운영합니다.</span>
            </label>

            <label className="mt-4 grid gap-2 text-sm text-zinc-300">
              <span>댓글 안내 문구</span>
              <textarea
                name="commentPolicyNote"
                defaultValue={initialValue?.commentPolicyNote ?? ''}
                rows={4}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="감상 위주의 댓글만 허용합니다, 스포일러는 자제해 주세요 같은 운영 문구"
              />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">맛보기/구독 공개 기준</h2>
            <div className="mt-5 grid gap-3 text-sm text-zinc-300">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <span className="font-semibold text-white">맛보기 공개</span>
                <p className="mt-1 text-zinc-400">총 회차 수와 설정한 비율을 기준으로 최소 1화가 무료 공개됩니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <span className="font-semibold text-white">구독 공개</span>
                <p className="mt-1 text-zinc-400">맛보기 이후 회차는 구독자에게만 열립니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <span className="font-semibold text-white">무료 아카이브</span>
                <p className="mt-1 text-zinc-400">체크하면 맛보기 비율과 무관하게 모든 공개 회차를 누구나 볼 수 있습니다.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-emerald-400/20 bg-emerald-500/5 p-6">
            <h2 className="text-xl font-bold text-white">정산 설정</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              인더버스의 일반 정산 분배는 작가 {BRAND.creatorSharePct}% / 회사 {BRAND.platformSharePct}%로 고정됩니다. 계좌정보는 서버에서 암호화해 저장하고, 화면에서는 기본적으로 마스킹된 상태로 다룹니다.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>정산 분배</span>
                <input type="hidden" name="creatorSharePct" value={String(BRAND.creatorSharePct)} />
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
                  defaultValue={initialValue?.revenueSettings.minPayoutAmount ?? 10000}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                />
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm text-zinc-300">
              <span>정산 방식</span>
              <select
                name="payoutMethod"
                defaultValue={initialValue?.revenueSettings.payoutMethod ?? ''}
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

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>은행명</span>
                <input
                  name="bankName"
                  defaultValue={initialValue?.revenueSettings.bankInfo.bankName ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="국민은행"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>예금주</span>
                <input
                  name="accountHolder"
                  defaultValue={initialValue?.revenueSettings.bankInfo.accountHolder ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="홍길동"
                />
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm text-zinc-300">
              <span>계좌번호</span>
              <input
                name="accountNumber"
                defaultValue={initialValue?.revenueSettings.bankInfo.accountNumber ?? ''}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="12345678901234"
              />
            </label>

            {initialValue?.revenueSettings.bankInfo.maskedSummary ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
                현재 저장된 계좌 요약: <span className="text-white">{initialValue.revenueSettings.bankInfo.maskedSummary}</span>
              </div>
            ) : null}
          </div>

          <div className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
            {channelId
              ? '채널 저장 후 아래 회차 섹션에서 실제 공개용 에피소드를 추가할 수 있습니다. 커버 이미지는 Supabase Storage에 올라가고, 메타데이터는 Supabase에 남습니다.'
              : '새 웹툰 채널은 먼저 저장한 뒤, 다음 화면에서 회차 생성과 이미지 업로드까지 이어서 진행하면 됩니다.'}
          </div>

          {state.error ? (
            <div className="rounded-3xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
              {state.error}
            </div>
          ) : null}

          <SubmitButton label={submitLabel} />
        </div>
      </section>
    </form>
  )
}
