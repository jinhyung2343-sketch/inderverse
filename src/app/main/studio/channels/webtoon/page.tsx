import Link from 'next/link'
import { PageBackLink } from '@/components/navigation/PageBackLink'

const webtoonFormats = [
  {
    href: '/main/studio/channels/webtoon/new',
    label: '연재 웹툰',
    description: '여러 회차와 컷 이미지를 쌓아가는 기본 웹툰 연재 형식입니다.',
  },
  {
    href: '/main/studio/channels/webtoon/short/new',
    label: '단편 웹툰',
    description: '한 편 또는 짧은 묶음으로 완결되는 단편 만화 형식입니다.',
  },
  {
    href: '/main/studio/channels/spark/new',
    label: '스파크',
    description: '단독 컷이나 4컷처럼 짧고 빠르게 공개하는 만화형 포맷입니다.',
  },
]

export default function WebtoonFormatSelectPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-7">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <PageBackLink href="/main/studio/channels" ariaLabel="내 작품으로 돌아가기" showLabel />

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Webtoon</p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">웹툰 만들기</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              만들고 싶은 웹툰 포맷을 먼저 선택하세요. 포맷에 맞는 편집기로 이어집니다.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {webtoonFormats.map((format) => (
            <Link
              key={format.href}
              href={format.href}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 transition hover:border-white/25 hover:bg-white/[0.09]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Webtoon Format</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight">{format.label}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">{format.description}</p>
              <p className="mt-6 text-sm font-semibold text-white">이 포맷으로 시작하기</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
