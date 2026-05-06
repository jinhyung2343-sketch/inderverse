import { createWebtoonChannel } from '@/app/main/studio/channels/actions'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { WebtoonEditorForm } from '@/components/webtoon/WebtoonEditorForm'

export default function NewWebtoonPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href="/main/studio/channels" ariaLabel="채널 메뉴로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Webtoon</p>
            <p className="text-sm text-zinc-400">텍스트 메타데이터는 Supabase에, 커버와 회차 이미지는 GCS에 두는 기본 구조입니다.</p>
          </div>
        </header>

        <WebtoonEditorForm
          action={createWebtoonChannel}
          heading="새 웹툰 채널 만들기"
          description="작품의 기본 정보와 공개 운용 기준을 먼저 저장합니다. 이후 회차와 이미지 업로드를 이어서 붙이면 실제 탐색 노출 구조까지 연결됩니다."
          submitLabel="웹툰 채널 저장"
          showContentRatingFieldset={false}
        />
      </div>
    </main>
  )
}
