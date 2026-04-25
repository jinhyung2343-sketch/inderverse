const channelModel = [
  'profiles -> channels -> episodes -> episode_images 구조로 작품 데이터를 구성합니다.',
  'warning 카테고리 태그와 is_adult_only 플래그를 함께 사용해 민감도와 접근 제한을 분리합니다.',
  '기다리면 무료, 유료, 무료 공개를 에피소드 단위로 조합할 수 있습니다.',
]

export default function StudioChannelsPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Channels</p>
          <h1 className="text-4xl font-black tracking-tight">채널 설계 원칙</h1>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <ul className="space-y-3 text-sm leading-6 text-zinc-300">
            {channelModel.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
