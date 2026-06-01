import Link from 'next/link'
import { ArtworkCoverImage } from '@/components/ui/ArtworkCoverImage'
import { getWorkTypeLabel } from '@/lib/work'
import type { WorkType } from '@/lib/work'

interface ArtworkCardProps {
  title: string
  authorName: string
  authorHref?: string
  coverImageUrl: string
  workType?: WorkType
  status: 'publishing' | 'completed'
  isAdultOnly: boolean
  href?: string
  tags?: string[]
  isCommentEnabled?: boolean
}

export function ArtworkCard({
  title,
  authorName,
  authorHref,
  coverImageUrl,
  workType,
  status,
  isAdultOnly,
  href,
  tags = [],
}: ArtworkCardProps) {
  const thumbnail = (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-bg-card transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:shadow-2xl">
      <ArtworkCoverImage src={coverImageUrl} />

      <div className="absolute left-2 top-2 flex flex-col gap-1">
        {isAdultOnly ? (
          <span className="rounded bg-red-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
            19
          </span>
        ) : null}
        {workType ? (
          <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
            {getWorkTypeLabel(workType)}
          </span>
        ) : null}
        {status === 'completed' ? (
          <span className="rounded bg-primary-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
            완결
          </span>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className={`group relative flex min-w-[160px] flex-col gap-3 md:min-w-[200px] ${href ? 'cursor-pointer' : ''}`}>
      {href ? (
        <Link
          href={href}
          aria-label={`${title} 작품 보기`}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-300"
        />
      ) : null}

      {thumbnail}

      <div className={`relative z-20 flex flex-col gap-1 px-1 ${href ? 'pointer-events-none' : ''}`}>
        <h3
          className="line-clamp-1 text-sm font-bold text-zinc-100 transition-colors group-hover:text-primary-300"
          aria-hidden={href ? true : undefined}
        >
          {title}
        </h3>
        {authorHref ? (
          <Link
            href={authorHref}
            className="pointer-events-auto line-clamp-1 w-fit text-xs text-zinc-400 transition hover:text-zinc-200"
          >
            {authorName}
          </Link>
        ) : (
          <p className="line-clamp-1 text-xs text-zinc-400">{authorName}</p>
        )}
        {tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
