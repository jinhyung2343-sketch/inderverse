import { ContentRatingFieldset } from '@/components/content/ContentRatingFieldset'
import { FreeArchiveConfirmField } from '@/components/studio/FreeArchiveConfirmField'
import { categories } from '@/lib/explore'
import type { CreatorNovelRecord } from '@/lib/novel'
import { getNovelStatusLabel, getNovelWorkScaleLabel } from '@/lib/novel'
import { WebtoonCoverField } from '@/components/webtoon/WebtoonCoverField'

const statusOptions = ['draft', 'publishing', 'completed'] as const
const categoryOptions = categories.filter((category) => category !== '전체')
const workScaleOptions = ['short', 'medium', 'long'] as const

export function NovelEditorForm({
  action,
  initialValue,
  heading,
  description,
  submitLabel,
  channelId,
  showContentRatingFieldset = true,
}: {
  action: (formData: FormData) => void | Promise<void>
  initialValue?: CreatorNovelRecord
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
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Novel Editor</p>
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
                  placeholder="웹소설 제목"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>작품 소개</span>
                <textarea
                  name="description"
                  required
                  defaultValue={initialValue?.description ?? ''}
                  rows={7}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="작품의 줄거리, 분위기, 독자에게 먼저 보여주고 싶은 문장을 적어주세요."
                />
              </label>

              <div className="grid gap-2 text-sm text-zinc-300">
                <span>커버 이미지</span>
                <WebtoonCoverField
                  channelId={channelId}
                  initialValue={initialValue?.coverImageUrl ?? ''}
                  workLabel="웹소설"
                />
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
                  defaultValue={initialValue?.category ?? '판타지'}
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
                      {getNovelStatusLabel(option)}
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
                placeholder="회귀, 로맨스판타지, 성장"
              />
            </label>

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
                      {getNovelWorkScaleLabel(option)}
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

            <FreeArchiveConfirmField defaultChecked={initialValue?.isFreeArchive ?? false} />
          </div>

          {showContentRatingFieldset ? (
            <ContentRatingFieldset
              initialAgeRating={initialValue?.ageRating ?? 'all'}
              initialChecklist={initialValue?.ratingChecklist}
            />
          ) : (
            <div className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
              작품 등급은 저장 직후 이어지는 전용 단계에서 확정합니다.
            </div>
          )}
        </div>

        <div className="space-y-6">
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
                placeholder="스포일러는 회차별 댓글에서 조심해 주세요 같은 운영 문구"
              />
            </label>
          </div>

          <div className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
            {channelId
              ? '작품 저장 후 회차 섹션에서 본문을 추가하고 공개 상태를 관리할 수 있습니다.'
              : '새 웹소설은 먼저 저장한 뒤, 다음 화면에서 회차 본문을 이어서 등록하면 됩니다.'}
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
