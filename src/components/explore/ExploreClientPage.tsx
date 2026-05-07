'use client'

import { useDeferredValue, useState } from 'react'
import { ArtworkCard } from '@/components/ui/ArtworkCard'
import { PageBackLink } from '@/components/navigation/PageBackLink'
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
  const hasActiveConditions =
    activeCategory !== '전체' || activeFilter !== '추천' || searchQuery.trim().length > 0

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

  const resetFilters = () => {
    setActiveCategory('전체')
    setActiveFilter('추천')
    setSearchQuery('')
  }

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#050505] px-5 py-8 text-white selection:bg-white/30 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="space-y-6 border-b border-white/10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <PageBackLink href="/main" ariaLabel="허브로 돌아가기" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Explore</p>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">{BRAND.name} 작품보기</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              보고 싶은 작품을 검색하거나 장르와 상태를 골라 바로 찾아보세요.
            </p>
          </div>

          <section className="space-y-4" aria-label="작품 검색과 필터">
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
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/25"
              />
            </div>

            <div className="space-y-3">
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="카테고리">
                {categories.map((category) => {
                  const isActive = category === activeCategory

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`h-10 shrink-0 rounded-full border px-4 text-sm transition ${
                        isActive
                          ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                          : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                      }`}
                      aria-pressed={isActive}
                    >
                      {category}
                    </button>
                  )
                })}
              </div>

              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="작품 상태">
                {quickFilters.map((filter) => {
                  const isActive = filter === activeFilter

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`h-10 shrink-0 rounded-full border px-4 text-sm transition ${
                        isActive
                          ? 'border-white/25 bg-white text-black'
                          : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                      }`}
                      aria-pressed={isActive}
                    >
                      {filter}
                    </button>
                  )
                })}
              </div>
            </div>

            {activeTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">추천 태그</span>
                {activeTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        </header>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {activeCategory} · {activeFilter}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                총 {filteredArtworks.length}개의 작품이 표시되고 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {searchQuery.trim().length > 0 ? (
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-zinc-300">
                  검색어: {searchQuery.trim()}
                </span>
              ) : null}
              {hasActiveConditions ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200"
                >
                  초기화
                </button>
              ) : null}
            </div>
          </div>

          {filteredArtworks.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.04] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-white">조건에 맞는 작품이 아직 없습니다.</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                카테고리를 바꾸거나 검색어를 비워두면 더 많은 작품을 볼 수 있습니다.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
