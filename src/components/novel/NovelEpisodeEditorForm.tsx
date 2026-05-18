import type { CreatorNovelEpisodeRecord } from '@/lib/novel'
import { getNovelEpisodeStatusLabel } from '@/lib/novel'

const statusOptions = ['draft', 'published', 'hidden'] as const

export function NovelEpisodeEditorForm({
  action,
  initialValue,
  heading,
  description,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>
  initialValue?: CreatorNovelEpisodeRecord
  heading: string
  description: string
  submitLabel: string
}) {
  return (
    <form action={action} className="grid gap-6">
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Novel Episode Editor</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{heading}</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{description}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_2.05fr]">
        <input type="hidden" name="pricingType" value="paid" />
        <input type="hidden" name="coinPrice" value="0" />
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">회차 정보</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>회차 제목</span>
                <input
                  name="title"
                  required
                  defaultValue={initialValue?.title ?? ''}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="1화. 낯선 문 앞에서"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>회차 번호</span>
                <input
                  type="number"
                  min={1}
                  name="episodeNumber"
                  required
                  defaultValue={initialValue?.episodeNumber ?? 1}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>회차 상태</span>
                <select
                  name="status"
                  defaultValue={initialValue?.status ?? 'draft'}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {getNovelEpisodeStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name="isAdultOnly"
                  defaultChecked={initialValue?.isAdultOnly ?? false}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
                />
                <span>이 회차는 성인 인증이 필요합니다.</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {submitLabel}
          </button>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">본문</h2>
          <label className="mt-5 grid gap-2 text-sm text-zinc-300">
            <span>회차 본문</span>
            <textarea
              name="bodyText"
              defaultValue={initialValue?.bodyText ?? ''}
              rows={28}
              className="min-h-[640px] rounded-2xl border border-white/10 bg-black/30 px-5 py-4 font-serif text-base leading-8 text-white outline-none transition focus:border-white/30"
              placeholder={`첫 문장을 입력하세요.\n\n문단은 빈 줄로 구분하면 공개 뷰어에서 자연스럽게 나뉩니다.`}
            />
          </label>
          <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-500/5 p-4 text-sm leading-6 text-zinc-300">
            공개 상태의 웹소설 회차는 최소 200자 이상의 본문이 필요합니다.
          </div>
        </div>
      </section>
    </form>
  )
}
