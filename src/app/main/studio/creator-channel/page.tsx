import Link from 'next/link'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { CreatorRegistrationCancelPanel } from '@/components/studio/CreatorRegistrationCancelPanel'
import { CreatorChannelSettingsForm } from '@/components/studio/CreatorChannelSettingsForm'
import { getBottegaHref, getBottegaLabel } from '@/lib/bottega'
import { ensureDefaultCreatorChannel } from '@/lib/server/creator-channels'
import { getCreatorNovelList } from '@/lib/server/novel-studio'
import { getCreatorSparkList } from '@/lib/server/spark'
import { getCreatorWebtoonList } from '@/lib/server/webtoon-studio'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type UserRole = Database['public']['Enums']['user_role']

export default async function CreatorChannelSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <PageBackLink href="/main" ariaLabel="허브로 돌아가기" />
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-8">
            <h1 className="text-3xl font-black tracking-tight">로그인이 필요합니다</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-400">Bottega를 관리하려면 먼저 로그인해 주세요.</p>
            <Link
              href="/join-prompt?next=/main/studio/creator-channel"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              로그인하고 계속하기
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as UserRole | undefined
  const canManageCreatorChannel = role === 'creator' || role === 'admin'

  if (!canManageCreatorChannel) {
    return (
      <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <PageBackLink href="/main" ariaLabel="허브로 돌아가기" />
          <section className="rounded-[32px] border border-emerald-400/20 bg-emerald-500/5 p-6 md:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Open Bottega</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">작가 등록 후 Bottega를 열 수 있습니다</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              작가 등록을 완료하면 개인 공방인 My Bottega가 생성됩니다. 장르를 고르면 해당 작업실과 공개 프로필을 바로 시작할 수 있습니다.
            </p>
            <Link
              href="/main/studio/creator-agreement"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Bottega 열기
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const channel = await ensureDefaultCreatorChannel(user.id)
  const [webtoonChannels, novelChannels, sparkChannels] = await Promise.all([
    getCreatorWebtoonList(),
    getCreatorNovelList(),
    getCreatorSparkList(),
  ])
  const publicChannelHref = `/main/creators/${channel.slug}`
  const canOpenPublicChannel = channel.status === 'active'
  const publicChannelTarget = canOpenPublicChannel ? publicChannelHref : '#channel-settings'
  const totalWorks = webtoonChannels.length + novelChannels.length + sparkChannels.length
  const publishedWorks = [
    ...webtoonChannels,
    ...novelChannels,
    ...sparkChannels,
  ].filter((work) => work.status === 'publishing' || work.status === 'completed').length
  const myBottegaHref = getBottegaHref(channel.primaryWorkType)
  const myBottegaLabel = getBottegaLabel(channel.primaryWorkType)
  const operationLinks = [
    {
      href: myBottegaHref,
      title: myBottegaLabel,
      description: channel.primaryWorkType
        ? '선택한 장르의 개인 작업실로 돌아갑니다.'
        : '아직 Bottega 장르를 고르지 않았다면 장르 선택부터 시작합니다.',
    },
    {
      href: myBottegaHref,
      title: '작업물 관리',
      description: '공개 상태, 회차, 표지, 태그를 선택한 장르의 작업 화면에서 조정합니다.',
    },
    {
      href: publicChannelTarget,
      title: canOpenPublicChannel ? '공개 프로필 확인' : '공개 프로필 전환',
      description: canOpenPublicChannel
        ? '독자에게 보이는 작가 프로필과 공개 작품 목록을 확인합니다.'
        : '공개 상태를 켜면 독자용 작가 페이지에 노출됩니다.',
    },
    {
      href: '/main/studio/settlements',
      title: '정산 확인',
      description: '유료 회차 구매와 정산 스냅샷을 점검합니다.',
    },
  ]

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <PageBackLink href="/main" ariaLabel="허브로 돌아가기" showLabel />
          <Link
            href={publicChannelTarget}
            className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            {canOpenPublicChannel ? '공개 프로필' : '비공개 상태'}
          </Link>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Public Profile</p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">공개 프로필 설정</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              {channel.displayName}의 독자용 작가 프로필입니다. My Bottega는 선택한 장르 작업실에서 열리고,
              이 화면은 공개 이름, 소개, 이미지와 외부 링크만 관리합니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={myBottegaHref}
                className="inline-flex min-h-11 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                {channel.primaryWorkType ? `${myBottegaLabel}로 돌아가기` : 'Bottega 장르 선택'}
              </Link>
              <Link
                href="#channel-settings"
                className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.06] px-6 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                공개 프로필 편집
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Status</p>
              <p className="mt-2 text-lg font-black">{channel.status === 'active' ? '공개' : '비공개'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Works</p>
              <p className="mt-2 text-2xl font-black">{totalWorks}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Live</p>
              <p className="mt-2 text-2xl font-black">{publishedWorks}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {operationLinks.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-lg border border-white/10 bg-white/[0.055] p-5 transition hover:border-white/25 hover:bg-white/[0.085]"
            >
              <h2 className="text-lg font-bold text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{item.description}</p>
            </Link>
          ))}
        </section>

        <section id="channel-settings" className="scroll-mt-8">
          <CreatorChannelSettingsForm channel={channel} />
        </section>

        <CreatorRegistrationCancelPanel />
      </div>
    </main>
  )
}
