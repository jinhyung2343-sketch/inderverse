import { createNovelChannel } from '@/app/main/studio/channels/actions'
import { NovelEditorForm } from '@/components/novel/NovelEditorForm'
import { PageBackLink } from '@/components/navigation/PageBackLink'

export default function NewNovelPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href="/main/studio/channels" ariaLabel="내 작품으로 돌아가기" />

        <NovelEditorForm
          action={createNovelChannel}
          heading="새 웹소설 만들기"
          description="작가 채널 아래에 연재형 텍스트 작품을 만들고, 이어지는 단계에서 등급과 회차 본문을 등록합니다."
          submitLabel="웹소설 저장"
          showContentRatingFieldset={false}
        />
      </div>
    </main>
  )
}
