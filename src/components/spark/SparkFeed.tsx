import { SparkCard } from '@/components/spark/SparkCard'
import { sparkWorks } from '@/lib/mock/spark-data'

export function SparkFeed() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_1.9fr]">
      <aside className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Spark Overview</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white">짧고 날카로운 만평 영역</h2>
        <p className="mt-4 text-sm leading-7 text-zinc-300">
          Spark는 사회, 정치, 인물 이슈를 위트 있게 압축하는 숏폼 섹션입니다. 지금은 카드 레이아웃만 먼저 고정해 두고,
          이후 후원, 댓글, 주제별 피드, 신고 규칙을 같은 구조 안에 이어 붙일 수 있게 뼈대를 분리했습니다.
        </p>

        <div className="mt-6 grid gap-3 text-sm text-zinc-300">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">포맷: 단독 컷 / 4컷 스트립</div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">주제: 사회, 정치, 인물 풍자</div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">다음 단계: 후원, 댓글, 신고 규칙, 큐레이션</div>
        </div>
      </aside>

      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Spark Cards</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">카드 레이아웃 프리뷰</h2>
          </div>
          <p className="text-sm text-zinc-400">{sparkWorks.length}개의 샘플 카드</p>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {sparkWorks.map((spark) => (
            <SparkCard key={spark.id} spark={spark} />
          ))}
        </div>
      </div>
    </section>
  )
}
