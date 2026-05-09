import Link from 'next/link'
import { ContentRatingFieldset } from '@/components/content/ContentRatingFieldset'
import type { ChannelAgeRating, RatingChecklist } from '@/lib/content-rating'
import type { WorkType } from '@/lib/work'

export function ContentRatingStepForm({
  action,
  channelId,
  workType,
  title,
  ageRating,
  ratingChecklist,
  backHref,
  nextPath,
}: {
  action: (formData: FormData) => void | Promise<void>
  channelId: string
  workType: WorkType
  title: string
  ageRating: ChannelAgeRating
  ratingChecklist: RatingChecklist
  backHref: string
  nextPath: string
}) {
  return (
    <form action={action} className="grid gap-6">
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            등급 저장하고 계속하기
          </button>
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
