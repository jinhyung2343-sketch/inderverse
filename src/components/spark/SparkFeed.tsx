import { SparkCard } from '@/components/spark/SparkCard'
import type { SparkRecord } from '@/lib/spark'

export function SparkFeed({ sparkWorks }: { sparkWorks: SparkRecord[] }) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">전체 스파크</h2>
          <p className="mt-1 text-sm text-zinc-400">
            지금 공개된 스파크 {sparkWorks.length}개를 최신 피드로 보여줍니다.
          </p>
        </div>
        <p className="text-sm text-zinc-500">단독 컷 · 4컷 스트립</p>
      </div>

      {sparkWorks.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sparkWorks.map((spark) => (
            <SparkCard key={spark.id} spark={spark} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.04] px-6 py-12 text-center">
          <p className="text-lg font-semibold text-white">공개된 스파크가 아직 없습니다.</p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            첫 공개 스파크가 올라오면 이 피드가 실제 데이터로 채워집니다.
          </p>
        </div>
      )}
    </section>
  )
}
