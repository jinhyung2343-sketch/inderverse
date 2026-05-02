import Link from 'next/link'
import { SparkEditorForm } from '@/components/spark/SparkEditorForm'
import { createSparkChannel } from '@/app/main/studio/channels/actions'

export default function NewSparkPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Spark</p>
            <p className="text-sm text-zinc-400">단독 컷과 4컷 만평을 같은 채널 모델 위에서 관리합니다.</p>
          </div>
          <Link
            href="/main/studio/channels"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            채널 메뉴로
          </Link>
        </header>

        <SparkEditorForm
          action={createSparkChannel}
          heading="새 스파크 만들기"
          description="스파크는 웹툰 연재보다 짧고 날카로운 포맷입니다. 지금은 최소 메타데이터와 이미지 URL만으로 공개 가능한 형태까지 연결합니다."
          submitLabel="스파크 저장"
          channelId={undefined}
        />
      </div>
    </main>
  )
}
