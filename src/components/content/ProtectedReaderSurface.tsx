'use client'

import Image from 'next/image'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  CONTENT_PROTECTION_VERSION,
  buildReaderWatermark,
  contentProtectionPolicy,
  getProtectedImageUrl,
  type ContentProtectionContext,
} from '@/lib/content-protection'

interface ProtectedReaderSurfaceProps extends ContentProtectionContext {
  children: ReactNode
  className?: string
}

interface ProtectedEpisodeImageProps {
  artworkId: string
  episodeId: string
  imageUrl: string
  index: number
  title: string
}

export function ProtectedReaderSurface({
  artworkId,
  children,
  className,
  episodeId,
  viewerId,
  viewerLabel,
}: ProtectedReaderSurfaceProps) {
  const [isHidden, setIsHidden] = useState(false)
  const watermark = useMemo(
    () => buildReaderWatermark({ artworkId, episodeId, viewerId, viewerLabel }),
    [artworkId, episodeId, viewerId, viewerLabel]
  )

  useEffect(() => {
    if (!contentProtectionPolicy.blurWhenHidden) {
      return
    }

    const syncVisibility = () => {
      setIsHidden(document.visibilityState === 'hidden')
    }

    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)

    return () => {
      document.removeEventListener('visibilitychange', syncVisibility)
    }
  }, [])

  return (
    <article
      className={`relative overflow-hidden ${className ?? ''}`}
      data-content-protection-version={CONTENT_PROTECTION_VERSION}
      onContextMenu={(event) => {
        if (contentProtectionPolicy.disableContextMenu) {
          event.preventDefault()
        }
      }}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {children}
      {contentProtectionPolicy.visibleWatermark ? <ReaderWatermark label={watermark} /> : null}
      {isHidden ? (
        <div className="pointer-events-none absolute inset-0 z-30 bg-black/80 backdrop-blur-md" aria-hidden="true" />
      ) : null}
    </article>
  )
}

export function ProtectedEpisodeImage({
  artworkId,
  episodeId,
  imageUrl,
  index,
  title,
}: ProtectedEpisodeImageProps) {
  const protectedUrl = getProtectedImageUrl({
    artworkId,
    episodeId,
    imageUrl,
    index,
  })

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/20">
      <Image
        src={protectedUrl}
        alt={`${title} 이미지 ${index + 1}`}
        width={1600}
        height={2400}
        sizes="100vw"
        draggable={!contentProtectionPolicy.blockImageDrag}
        onContextMenu={(event) => {
          if (contentProtectionPolicy.disableContextMenu) {
            event.preventDefault()
          }
        }}
        className="h-auto w-full"
      />
      <div className="pointer-events-none absolute inset-0 border border-white/5" aria-hidden="true" />
    </div>
  )
}

function ReaderWatermark({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden opacity-[0.08]" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 grid w-[180%] -translate-x-1/2 -translate-y-1/2 -rotate-12 grid-cols-2 gap-10 text-center text-[11px] font-semibold uppercase text-white md:grid-cols-3">
        {Array.from({ length: 24 }).map((_, index) => (
          <span key={`${label}-${index}`} className="whitespace-nowrap">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
