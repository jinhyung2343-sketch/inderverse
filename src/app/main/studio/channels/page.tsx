import { selectPrimaryBottega } from '@/app/main/studio/channels/actions'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { getBottegaHref } from '@/lib/bottega'
import { ensureDefaultCreatorChannel } from '@/lib/server/creator-channels'
import { createClient } from '@/lib/supabase/server'
import { bottegaGenres } from '@/lib/bottega-catalog'
import { redirect } from 'next/navigation'

export default async function BottegaGenreSelectPage({
  searchParams,
}: {
  searchParams?: Promise<{ setup?: string }>
}) {
  const params = await searchParams
  const isRegistrationSetup = params?.setup === '1'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const creatorChannel = user ? await ensureDefaultCreatorChannel(user.id) : null

  if (creatorChannel && !isRegistrationSetup) {
    redirect(getBottegaHref(creatorChannel.primaryWorkType))
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <PageBackLink href="/main" ariaLabel="허브로 돌아가기" showLabel />

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Choose Genre</p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">어떤 Bottega를 열까요?</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              작가 등록 다음 단계입니다. 여기서 고른 장르가 처음 열리는 My Bottega의 기본 작업실이 됩니다.
            </p>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {bottegaGenres.map((genre) =>
            genre.isReady && genre.workType ? (
              <form
                key={genre.id}
                action={selectPrimaryBottega}
                className="group flex min-h-[260px] flex-col rounded-lg border border-white/10 bg-white/[0.06] p-5 transition hover:border-white/25 hover:bg-white/[0.09]"
              >
                <input type="hidden" name="workType" value={genre.workType} />
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${genre.accentClassName}`}>
                    선택 가능
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{genre.role}</span>
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight">{genre.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{genre.description}</p>
                <p className="mt-3 text-xs leading-5 text-zinc-500">{genre.note}</p>
                <button type="submit" className="mt-auto pt-6 text-left text-sm font-semibold text-white">
                  이 장르를 기본 Bottega로 설정
                </button>
              </form>
            ) : (
              <div
                key={genre.id}
                className="flex min-h-[260px] flex-col rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${genre.accentClassName}`}>
                    준비 중
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">{genre.role}</span>
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight text-zinc-300">{genre.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500">{genre.description}</p>
                <p className="mt-3 text-xs leading-5 text-zinc-600">{genre.note}</p>
                <p className="mt-auto pt-6 text-sm font-semibold text-zinc-500">나중에 열릴 Bottega</p>
              </div>
            )
          )}
        </section>
      </div>
    </main>
  )
}
