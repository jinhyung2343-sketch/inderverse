import { EpisodeImagesField } from '@/components/webtoon/EpisodeImagesField'
import type { CreatorWebtoonEpisodeRecord } from '@/lib/webtoon'
import { getEpisodePricingLabel, getEpisodeStatusLabel } from '@/lib/webtoon'

const pricingOptions = ['free', 'paid', 'wait_free'] as const
const statusOptions = ['draft', 'published', 'hidden'] as const

export function WebtoonEpisodeEditorForm({
  action,
  channelId,
  episodeId,
  initialValue,
  heading,
  description,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>
  channelId: string
  episodeId?: string
  initialValue?: CreatorWebtoonEpisodeRecord
  heading: string
  description: string
  submitLabel: string
}) {
  return (
    <form action={action} className="grid gap-6">
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Episode Editor</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{heading}</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{description}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_1.95fr]">
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
                  placeholder="1화. 첫 번째 장면"
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
                <span>가격 정책</span>
                <select
                  name="pricingType"
                  defaultValue={initialValue?.pricingType ?? 'free'}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                >
                  {pricingOptions.map((option) => (
                    <option key={option} value={option}>
                      {getEpisodePricingLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>코인 가격</span>
                <input
                  type="number"
                  min={0}
                  name="coinPrice"
                  defaultValue={initialValue?.coinPrice ?? 7}
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
                      {getEpisodeStatusLabel(option)}
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

          <div className="rounded-[32px] border border-sky-400/20 bg-sky-500/5 p-6 text-sm leading-7 text-zinc-300">
            공개 상태의 회차는 최소 1장의 이미지가 필요합니다. 이미지는 GCS에 업로드되고, 저장하면 정렬 순서와 URL이 `episode_images`에 반영됩니다.
          </div>

          <button
            type="submit"
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {submitLabel}
          </button>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">회차 이미지</h2>
          <div className="mt-5">
            <EpisodeImagesField
              channelId={channelId}
              episodeId={episodeId}
              initialImages={initialValue?.images ?? []}
            />
          </div>
        </div>
      </section>
    </form>
  )
}

