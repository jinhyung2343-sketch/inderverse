import Link from 'next/link'
import { SparkCard } from '@/components/spark/SparkCard'
import type { SparkRecord } from '@/lib/spark'

export function SavedSparkShelf({ sparks, isGuest = false }: { sparks: SparkRecord[]; isGuest?: boolean }) {
  if (sparks.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-6 text-zinc-300">
        {isGuest
          ? '스파크 저장 목록은 로그인 후 계정 기준으로 표시됩니다. 게스트 모드에서는 목록이 비어 있는 구조로 보입니다.'
          : '아직 저장한 스파크가 없습니다. 스파크 상세에서 저장 버튼을 누르면 이곳에 쌓입니다.'}
      </section>
    )
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
        저장한 스파크 {sparks.length}개가 이 서재에 모여 있습니다.
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sparks.map((spark) => (
          <SparkCard key={spark.id} spark={spark} />
        ))}
      </div>

      <Link href="/main/spark" className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10">
        스파크 더 둘러보기
      </Link>
    </section>
  )
}
