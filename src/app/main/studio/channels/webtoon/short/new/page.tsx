import { createWebtoonChannel } from '@/app/main/studio/channels/actions'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { WebtoonEditorForm } from '@/components/webtoon/WebtoonEditorForm'

export default function NewShortWebtoonPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href="/main/studio/channels/webtoon" ariaLabel="웹툰 만들기로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Webtoon / Short</p>
            <p className="text-sm text-zinc-400">
              단편 웹툰도 같은 웹툰 제작 흐름 위에서 만들고, 필요한 경우 짧은 회차 묶음으로 확장할 수 있습니다.
            </p>
          </div>
        </header>

        <WebtoonEditorForm
          action={createWebtoonChannel}
          heading="새 단편 웹툰 만들기"
          description="짧게 완결되는 웹툰의 기본 정보와 공개 운용 기준을 먼저 저장합니다. 저장 후 회차와 이미지를 붙여 단편 작품으로 공개할 수 있습니다."
          submitLabel="단편 웹툰 저장"
          showContentRatingFieldset={false}
        />
      </div>
    </main>
  )
}
