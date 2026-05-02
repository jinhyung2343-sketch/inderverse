'use client'

import Link from 'next/link'
import { useDeferredValue, useState } from 'react'
import { ArtworkCard } from '@/components/ui/ArtworkCard'
import { BRAND } from '@/lib/brand'
import {
  categories,
  categoryTags,
  quickFilters,
  type ExploreArtwork,
} from '@/lib/explore'

export function ExploreClientPage({
  initialArtworks,
}: {
  initialArtworks: ExploreArtwork[]
}) {
  const [activeCategory, setActiveCategory] = useState('전체')
  const [activeFilter, setActiveFilter] = useState('추천')
  const [searchQuery, setSearchQuery] = useState('')
  const deferredQuery = useDeferredValue(searchQuery)
  const activeTags = categoryTags[activeCategory] ?? []
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const filteredArtworks = initialArtworks.filter((artwork) => {
    const matchesCategory = activeCategory === '전체' || artwork.category === activeCategory
    const matchesFilter = activeFilter === '추천' || artwork.filterTags.includes(activeFilter)
    const matchesQuery =
      normalizedQuery.length === 0 ||
      artwork.title.toLowerCase().includes(normalizedQuery) ||
      artwork.authorName.toLowerCase().includes(normalizedQuery) ||
      artwork.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))

    return matchesCategory && matchesFilter && matchesQuery
  })

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#050505] px-6 py-8 text-white selection:bg-white/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Explore</p>
              <h1 className="text-4xl font-black tracking-tight">{BRAND.name} 작품보기</h1>
              <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                공개 가능한 웹툰 채널을 실제 데이터 기준으로 보여줍니다. 검색과 카테고리 UX는 유지하면서,
                없는 정보만 프로토타입 설명으로 보강하도록 연결했습니다.
              </p>
            </div>

            <Link
              href="/main"
              className="hidden rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10 md:inline-flex"
            >
              허브로 돌아가기
            </Link>
          </div>

          <section className="rounded-[32px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:p-5">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="작품명, 작가명, 태그로 검색"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/25"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isActive = category === activeCategory

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        isActive
                          ? 'border border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                          : 'border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                      }`}
                    >
                      {category}
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                {activeTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_2.8fr]">
          <article className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Quick Menu</p>
            <div className="mt-5 grid gap-3">
              {quickFilters.map((filter) => {
                const isActive = filter === activeFilter

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? 'border-white/20 bg-white/10 text-white'
                        : 'border-white/10 bg-black/20 text-zinc-400 hover:bg-white/8 hover:text-zinc-200'
                    }`}
                  >
                    <span className="block text-base font-semibold">{filter}</span>
                    <span className="mt-1 block text-sm text-zinc-500">
                      {filter === '추천' && '현재 공개 흐름에서 먼저 보여줄 채널'}
                      {filter === '최신' && '진행 중인 웹툰 채널 중심의 탐색'}
                      {filter === '인기' && '회차가 어느 정도 쌓인 공개 채널'}
                      {filter === '완결' && '정주행 가능한 완결 채널'}
                      {filter === '기다리면 무료' && '기다리면 무료 회차가 포함된 채널'}
                    </span>
                  </button>
                )
              })}
            </div>
          </article>

          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Curated Feed</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  {activeCategory} · {activeFilter}
                </h2>
              </div>
              <p className="text-sm text-zinc-400">
                총 {filteredArtworks.length}개의 작품이 표시되고 있습니다.
              </p>
            </div>

            {filteredArtworks.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {filteredArtworks.map((artwork) => (
                  <ArtworkCard
                    key={artwork.id}
                    title={artwork.title}
                    authorName={artwork.authorName}
                    coverImageUrl={artwork.coverImageUrl}
                    status={artwork.status}
                    isAdultOnly={artwork.isAdultOnly}
                    isCommentEnabled={artwork.isCommentEnabled}
                    tags={artwork.tags}
                    href={`/main/explore/${artwork.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-12 text-center">
                <p className="text-lg font-semibold text-white">조건에 맞는 작품이 아직 없습니다.</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  카테고리를 바꾸거나 검색어를 비워두면 더 많은 작품을 볼 수 있습니다.
                </p>
              </div>
            )}
          </section>
        </section>

        <Link
          href="/main"
          className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10 md:hidden"
        >
          허브로 돌아가기
        </Link>
      </div>
    </main>
  )
}
