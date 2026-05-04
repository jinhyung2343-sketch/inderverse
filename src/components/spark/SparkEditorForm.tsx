import Link from 'next/link'
import { ContentRatingFieldset } from '@/components/content/ContentRatingFieldset'
import type { SparkRecord } from '@/lib/spark'
import { getSparkFormatLabel, getSparkStatusLabel } from '@/lib/spark'
import { SparkCoverField } from '@/components/spark/SparkCoverField'
import { SparkPanelField } from '@/components/spark/SparkPanelField'

const statusOptions = ['draft', 'publishing', 'completed'] as const
const formatOptions = ['single_cut', 'four_cut'] as const

export function SparkEditorForm({
  action,
  initialValue,
  heading,
  description,
  submitLabel,
  channelId,
  showContentRatingFieldset = true,
}: {
  action: (formData: FormData) => void | Promise<void>
  initialValue?: SparkRecord
  heading: string
  description: string
  submitLabel: string
  channelId?: string
  showContentRatingFieldset?: boolean
}) {
  return (
    <form action={action} className="grid gap-6">
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
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Spark Editor</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{heading}</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{description}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">기본 정보</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>제목</span>
                <input
                  name="title"
                  required
                  defaultValue={initialValue?.title ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="스파크 제목"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>한 줄 카피</span>
                <input
                  name="caption"
                  required
                  defaultValue={initialValue?.caption ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="카드 하단에 들어갈 짧은 문장"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>요약 / 설명</span>
                <textarea
                  name="description"
                  required
                  defaultValue={initialValue?.description ?? ''}
                  rows={6}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="이 스파크가 무엇을 비트는지, 어떤 맥락인지 적어주세요."
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>커버 이미지</span>
                <SparkCoverField channelId={channelId} initialValue={initialValue?.coverImageUrl ?? ''} />
              </label>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">포맷과 공개 상태</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>포맷</span>
                <select
                  name="format"
                  defaultValue={initialValue?.format ?? 'single_cut'}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                >
                  {formatOptions.map((option) => (
                    <option key={option} value={option}>
                      {getSparkFormatLabel(option)}
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
                      {getSparkStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-300">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <span className="font-semibold text-white">초안</span>
                <p className="mt-1 text-zinc-400">공개 피드에는 보이지 않습니다. 제목, 커버, 문구를 다듬는 내부 준비 단계입니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <span className="font-semibold text-white">공개 중</span>
                <p className="mt-1 text-zinc-400">`/main/spark` 피드와 공개 상세 페이지에 노출됩니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <span className="font-semibold text-white">아카이브</span>
                <p className="mt-1 text-zinc-400">새 피드에서는 뒤로 밀리지만 공개 링크는 유지되는 보관 상태로 사용하면 좋습니다.</p>
              </div>
            </div>

          </div>

          {showContentRatingFieldset ? (
            <ContentRatingFieldset
              initialAgeRating={initialValue?.ageRating ?? 'all'}
              initialChecklist={initialValue?.ratingChecklist}
              sectionTitle="스파크 등급 분류"
            />
          ) : (
            <div className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
              등급 분류는 저장 직후 이어지는 전용 단계에서 설정합니다. 지금은 작품 기본 정보와 카드 구성을 먼저
              저장합니다.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">풍자 메타데이터</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>주제</span>
                <input
                  name="topic"
                  required
                  defaultValue={initialValue?.topic ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="정치 풍자 / 사회 이슈 / 인물 패러디"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>펀치라인</span>
                <textarea
                  name="punchline"
                  required
                  defaultValue={initialValue?.punchline ?? ''}
                  rows={4}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="카드 하단의 한 방 문장"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>태그</span>
                <input
                  name="tags"
                  defaultValue={initialValue?.tags.join(', ') ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="정치, 브리핑, 4컷"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>톤</span>
                <input
                  name="tone"
                  defaultValue={initialValue?.tone ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="건조한 풍자 / 재치 있는 냉소"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>외부 링크</span>
                <input
                  name="externalUrl"
                  defaultValue={initialValue?.externalUrl ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="관련 기사나 참고 링크가 있으면 입력"
                />
              </label>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">실제 컷 구성</h2>
            <div className="mt-5">
              <SparkPanelField
                channelId={channelId}
                initialPanels={initialValue?.panels ?? []}
                initialFormat={initialValue?.format ?? 'single_cut'}
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
            {channelId ? (
              <>
                커버와 패널 이미지를 올린 뒤 저장하면 공개 페이지에 바로 반영됩니다.{' '}
                {initialValue && (initialValue.status === 'publishing' || initialValue.status === 'completed') ? (
                  <Link href={`/main/spark/${initialValue.id}`} className="text-white underline underline-offset-4">
                    현재 공개 페이지 보기
                  </Link>
                ) : (
                  '초안 상태에서는 외부 공개 피드에 보이지 않습니다.'
                )}
              </>
            ) : (
              '새 스파크는 먼저 초안으로 저장한 뒤, 다음 화면에서 GCS 업로드와 공개 상태 전환까지 이어서 진행하면 됩니다.'
            )}
          </div>

          <button
            type="submit"
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {submitLabel}
          </button>
        </div>
      </section>
    </form>
  )
}
