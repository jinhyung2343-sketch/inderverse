import { createWebtoonChannelWithState } from '@/app/main/studio/channels/actions'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { StudioFlowSteps } from '@/components/studio/StudioFlowSteps'
import { WebtoonEditorForm } from '@/components/webtoon/WebtoonEditorForm'

export default function NewWebtoonPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href="/main/studio/channels/webtoon" ariaLabel="Toon Bottega로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">My Bottega / Toon / Series</p>
            <p className="text-sm text-zinc-400">연재 툰 작업실입니다. 커버, 회차 이미지, 공개 상태를 같은 흐름에서 쌓아갑니다.</p>
          </div>
        </header>

        <StudioFlowSteps
          currentStep={1}
          steps={[
            { label: '작품 정보 저장', description: '제목, 소개, 커버, 장르, 연재 요일' },
            { label: '등급 지정', description: '연령 등급과 수위 체크리스트' },
            { label: '회차 업로드', description: '1화 제목과 원고 이미지' },
          ]}
        />

        <WebtoonEditorForm
          action={createWebtoonChannelWithState}
          heading="새 연재 툰 만들기"
          description="작품의 기본 정보와 공개 운용 기준을 먼저 저장합니다. 이후 회차와 이미지 업로드를 붙이면 탐색 노출 구조까지 연결됩니다."
          submitLabel="작품 정보 저장하고 등급 지정하기"
          showContentRatingFieldset={false}
        />
      </div>
    </main>
  )
}
