import { SparkEditorForm } from '@/components/spark/SparkEditorForm'
import { createSparkChannel } from '@/app/main/studio/channels/actions'
import { PageBackLink } from '@/components/navigation/PageBackLink'

export default function NewSparkPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageBackLink href="/main/studio/channels" ariaLabel="채널 메뉴로 돌아가기" />

        <header>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Spark</p>
            <p className="text-sm text-zinc-400">단독 컷과 4컷 만평을 같은 채널 모델 위에서 관리합니다.</p>
          </div>
        </header>

        <SparkEditorForm
          action={createSparkChannel}
          heading="새 스파크 만들기"
          description="스파크는 웹툰 연재보다 짧고 날카로운 포맷입니다. 지금은 최소 메타데이터와 이미지 URL만으로 공개 가능한 형태까지 연결합니다."
          submitLabel="스파크 저장"
          channelId={undefined}
          showContentRatingFieldset={false}
        />
      </div>
    </main>
  )
}
