import { ArtPlatformShell } from '@/components/layout/ArtPlatformShell'

const sampleWorks = [
  {
    title: 'Silent Neon Archive',
    meta: 'Visual Essay',
    description: '도시의 빛과 창작자의 기록을 느슨하게 엮은 테스트 콘텐츠 영역입니다.',
  },
  {
    title: 'Paper Planets',
    meta: 'Webtoon',
    description: '서브 페이지 컴포넌트가 들어갈 자리를 확인하기 위한 유연한 카드입니다.',
  },
  {
    title: 'Studio Notes',
    meta: 'Creator Log',
    description: '확정 전 디자인 톤을 빠르게 비교할 수 있도록 구성했습니다.',
  },
]

export default function ConceptShellPage() {
  return (
    <ArtPlatformShell
      eyebrow="Layout Concept"
      title="Modern art shell for a living platform"
      description="메뉴, 로고, 색상 토큰은 설정 객체에서 관리하고, 이 영역은 앞으로 Feed, Discover, Studio 같은 실제 페이지 컴포넌트로 교체할 수 있습니다."
      actions={
        <>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-lg bg-white px-5 text-sm font-semibold text-black transition-all duration-500 ease-out hover:scale-[1.02] hover:bg-zinc-200"
          >
            Primary Action
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-zinc-200 backdrop-blur-xl transition-all duration-500 ease-out hover:scale-[1.02] hover:border-white/20 hover:bg-white/[0.09]"
          >
            Secondary
          </button>
        </>
      }
    >
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="min-h-[360px] rounded-lg border border-white/10 bg-white/[0.055] p-6 backdrop-blur-2xl md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Featured Canvas</p>
          <div className="mt-20 max-w-xl">
            <h2 className="text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
              Make room for the work, then let the interface breathe.
            </h2>
            <p className="mt-5 text-sm leading-7 text-zinc-400 md:text-base">
              이 큰 영역은 피드, 작품 상세, 작가 스튜디오 등 어떤 페이지든 갈아끼울 수 있는 children 슬롯입니다.
            </p>
          </div>
        </article>

        <aside className="rounded-lg border border-white/10 bg-white/[0.045] p-6 backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Config First</p>
          <div className="mt-6 grid gap-4 text-sm leading-6 text-zinc-400">
            <p>로고 경로, 브랜드명, 포인트 컬러, 메뉴 배열은 모두 설정 파일에서 바꿉니다.</p>
            <p>셸은 디자인 방향을 잡는 껍데기이고, 실제 기능 페이지는 children으로 들어옵니다.</p>
          </div>
        </aside>
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-3">
        {sampleWorks.map((work) => (
          <article
            key={work.title}
            className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl transition-all duration-500 ease-out hover:scale-[1.015] hover:border-white/20 hover:bg-white/[0.075] hover:shadow-[0_22px_70px_rgba(45,212,191,0.10)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500">{work.meta}</p>
            <h3 className="mt-5 text-xl font-bold tracking-tight text-white">{work.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{work.description}</p>
          </article>
        ))}
      </section>
    </ArtPlatformShell>
  )
}
