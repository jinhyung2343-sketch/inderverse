'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ArtworkCoverImageProps {
  src: string
}

export function ArtworkCoverImage({ src }: ArtworkCoverImageProps) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 px-4 text-center">
        <span className="text-xs font-semibold text-zinc-500">표지 준비 중</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      sizes="(max-width: 768px) 160px, 200px"
      onError={() => setHasError(true)}
    />
  )
}
