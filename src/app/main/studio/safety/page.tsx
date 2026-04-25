const safetyNotes = [
  '성인 작품은 태그와 작품 플래그를 함께 사용해 노출과 접근을 분리 제어합니다.',
  'PASS/휴대폰 인증은 age_verifications 테이블에 이력으로 남기고 profiles.is_adult_verified를 갱신합니다.',
  '법적 제한 대상과 플랫폼 정책 위반은 별도 운영 도구로 다루되, 표현 가능 범위는 최대한 넓게 유지하는 방향입니다.',
]

export default function StudioSafetyPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Studio / Safety</p>
          <h1 className="text-4xl font-black tracking-tight">성인 인증과 안전장치</h1>
        </header>

        <section className="rounded-3xl border border-rose-400/20 bg-rose-500/5 p-6">
          <ul className="space-y-3 text-sm leading-6 text-zinc-300">
            {safetyNotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
