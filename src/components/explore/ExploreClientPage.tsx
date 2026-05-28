'use client'

import Image from 'next/image'
import { useDeferredValue, useState } from 'react'
import { ArtworkCard } from '@/components/ui/ArtworkCard'
import Link from 'next/link'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { BRAND } from '@/lib/brand'
import {
  categories,
  categoryTags,
  quickFilters,
  type ExploreArtwork,
} from '@/lib/explore'
import type { PublicCreatorChannelSummary } from '@/lib/public-creator'
import { matchesSearchQuery } from '@/lib/search'
import { getWorkTypeLabel } from '@/lib/work'

const workTypeFilters = ['전체 형식', 'webtoon', 'novel'] as const
type ExploreView = 'works' | 'creators'

const exploreViewOptions: Array<{
  href: string
  label: string
  value: ExploreView
}> = [
  {
    href: '/main/explore',
    label: '작품보기',
    value: 'works',
  },
  {
    href: '/main/explore?view=creators',
    label: '작가보기',
    value: 'creators',
  },
]

function CreatorChannelCard({ creator }: { creator: PublicCreatorChannelSummary }) {
  return (
    <Link
      href={`/main/creators/${creator.slug}`}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] transition hover:border-white/25 hover:bg-white/[0.085]"
    >
      <div
        className="h-24 bg-zinc-900 bg-cover bg-center"
        style={
          creator.coverImageUrl
            ? { backgroundImage: `linear-gradient(to top, rgba(5,5,5,0.72), rgba(5,5,5,0.12)), url(${creator.coverImageUrl})` }
            : undefined
        }
      />
      <div className="p-5">
        <div className="-mt-14 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-zinc-900 text-2xl font-black text-zinc-500">
          {creator.avatarUrl ? (
            <Image
              src={creator.avatarUrl}
              alt={creator.displayName}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            creator.displayName.slice(0, 1)
          )}
        </div>
        <p className="mt-4 text-xs text-zinc-500">@{creator.slug}</p>
        <h3 className="mt-1 line-clamp-1 text-xl font-bold text-white">{creator.displayName}</h3>
        <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-zinc-400">
          {creator.bio || '작가 소개가 아직 준비 중입니다.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-300">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">작품 {creator.artworkCount}</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">웹툰 {creator.webtoonCount}</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">웹소설 {creator.novelCount}</span>
        </div>
        {creator.latestArtworkTitle ? (
          <p className="mt-4 line-clamp-1 text-xs text-zinc-500">최근 작품: {creator.latestArtworkTitle}</p>
        ) : null}
      </div>
    </Link>
  )
}

export function ExploreClientPage({
  initialArtworks,
  initialCreators,
  initialView = 'works',
}: {
  initialArtworks: ExploreArtwork[]
  initialCreators: PublicCreatorChannelSummary[]
  initialView?: ExploreView
}) {
  const [activeView, setActiveView] = useState<ExploreView>(initialView)
  const [activeCategory, setActiveCategory] = useState('전체')
  const [activeFilter, setActiveFilter] = useState('추천')
  const [activeWorkType, setActiveWorkType] = useState<(typeof workTypeFilters)[number]>('전체 형식')
  const [searchQuery, setSearchQuery] = useState('')
  const deferredQuery = useDeferredValue(searchQuery)
  const activeTags = categoryTags[activeCategory] ?? []
  const hasSearchQuery = deferredQuery.trim().length > 0
  const isCreatorView = activeView === 'creators'
  const hasActiveConditions = isCreatorView
    ? searchQuery.trim().length > 0
    : activeCategory !== '전체' ||
      activeFilter !== '추천' ||
      activeWorkType !== '전체 형식' ||
      searchQuery.trim().length > 0

  const filteredArtworks = initialArtworks.filter((artwork) => {
    const matchesWorkType = hasSearchQuery || activeWorkType === '전체 형식' || artwork.workType === activeWorkType
    const matchesCategory = hasSearchQuery || activeCategory === '전체' || artwork.category === activeCategory
    const matchesFilter = hasSearchQuery || activeFilter === '추천' || artwork.filterTags.includes(activeFilter)
    const matchesQuery =
      !hasSearchQuery ||
      matchesSearchQuery(deferredQuery, [
        artwork.title,
        artwork.authorName,
        artwork.category,
        artwork.blurb,
        artwork.summary,
        ...artwork.tags,
        ...artwork.filterTags,
      ])

    return matchesWorkType && matchesCategory && matchesFilter && matchesQuery
  })

  const filteredCreators = initialCreators.filter((creator) => {
    if (!hasSearchQuery) {
      return true
    }

    return matchesSearchQuery(deferredQuery, [
      creator.displayName,
      creator.slug,
      creator.bio,
      creator.latestArtworkTitle,
    ])
  })

  const resetFilters = () => {
    setActiveCategory('전체')
    setActiveFilter('추천')
    setActiveWorkType('전체 형식')
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
              먼저 작품을 볼지, 작가를 볼지 선택한 뒤 원하는 목록만 차분하게 탐색하세요.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1 sm:w-fit sm:flex-row">
            {exploreViewOptions.map((option) => {
              const isActive = option.value === activeView

              return (
                <Link
                  key={option.value}
                  href={option.href}
                  onClick={() => {
                    setActiveView(option.value)
                    resetFilters()
                  }}
                  className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {option.label}
                </Link>
              )
            })}
          </div>

          <section className="space-y-4" aria-label={isCreatorView ? '작가 검색' : '작품 검색과 필터'}>
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
                placeholder={isCreatorView ? '작가명, 채널명으로 검색' : '작품명, 작가명, 태그로 검색'}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/25"
              />
            </div>

            {!isCreatorView ? (
              <div className="space-y-3">
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="작품 형식">
                  {workTypeFilters.map((workType) => {
                    const isActive = workType === activeWorkType
                    const label = workType === '전체 형식' ? workType : getWorkTypeLabel(workType)

                    return (
                      <button
                        key={workType}
                        type="button"
                        onClick={() => setActiveWorkType(workType)}
                        className={`h-10 shrink-0 rounded-full border px-4 text-sm transition ${
                          isActive
                            ? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
                            : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                        }`}
                        aria-pressed={isActive}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

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
            ) : null}

            {!isCreatorView && activeTags.length > 0 ? (
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
                {hasSearchQuery ? '검색 결과' : isCreatorView ? '작가보기' : `${activeCategory} · ${activeFilter}`}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {isCreatorView
                  ? `총 ${filteredCreators.length}개의 작가 채널이 표시되고 있습니다.`
                  : `총 ${filteredArtworks.length}개의 작품이 표시되고 있습니다.`}
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

          {isCreatorView ? (
            filteredCreators.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCreators.map((creator) => (
                  <CreatorChannelCard key={creator.id} creator={creator} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.04] px-6 py-12 text-center">
                <p className="text-lg font-semibold text-white">조건에 맞는 작가 채널이 없습니다.</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">검색어를 비워두면 더 많은 작가 채널을 볼 수 있습니다.</p>
              </div>
            )
          ) : filteredArtworks.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredArtworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  title={artwork.title}
                  authorName={artwork.authorName}
                  authorHref={artwork.creatorSlug ? `/main/creators/${artwork.creatorSlug}` : undefined}
                  coverImageUrl={artwork.coverImageUrl}
                  workType={artwork.workType}
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
