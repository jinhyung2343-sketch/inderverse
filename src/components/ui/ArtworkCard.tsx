import Image from 'next/image'
import Link from 'next/link'
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
  isCommentEnabled = true,
}: ArtworkCardProps) {
  const thumbnail = (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-bg-card transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:shadow-2xl">
      {coverImageUrl ? (
        <Image
          src={coverImageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 160px, 200px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-600">
          No Image
        </div>
      )}

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

      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex translate-y-4 items-center gap-1.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {isCommentEnabled ? (
            <span className="flex items-center text-xs text-zinc-300">
              <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              댓글 켬
            </span>
          ) : (
            <span className="flex items-center text-xs text-red-300">
              <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8z" />
              </svg>
              댓글 끔
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="group relative flex min-w-[160px] cursor-pointer flex-col gap-3 md:min-w-[200px]">
      {href ? <Link href={href}>{thumbnail}</Link> : thumbnail}

      <div className="flex flex-col gap-1 px-1">
        {href ? (
          <Link
            href={href}
            className="line-clamp-1 text-sm font-bold text-zinc-900 transition-colors group-hover:text-primary-500 dark:text-zinc-100"
          >
            {title}
          </Link>
        ) : (
          <h3 className="line-clamp-1 text-sm font-bold text-zinc-900 transition-colors group-hover:text-primary-500 dark:text-zinc-100">
            {title}
          </h3>
        )}
        {authorHref ? (
          <Link
            href={authorHref}
            className="line-clamp-1 w-fit text-xs text-zinc-500 transition hover:text-zinc-200 dark:text-zinc-400"
          >
            {authorName}
          </Link>
        ) : (
          <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{authorName}</p>
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
