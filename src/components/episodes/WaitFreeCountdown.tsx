'use client'

import { useEffect, useMemo, useState } from 'react'

function formatRemaining(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function WaitFreeCountdown({
  hours,
  prefix = '무료 해금까지',
  completeLabel = '지금 무료 해금 가능',
}: {
  hours: number
  prefix?: string
  completeLabel?: string
}) {
  const initialSeconds = useMemo(() => Math.max(0, Math.floor(hours * 3600)), [hours])
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  const remainingSeconds = Math.max(
    0,
    initialSeconds - Math.floor((now - startedAt) / 1000)
  )

  useEffect(() => {
    if (initialSeconds === 0) {
      return
    }

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [initialSeconds])

  if (remainingSeconds === 0) {
    return <span>{completeLabel}</span>
  }

  return (
    <span>
      {prefix} {formatRemaining(remainingSeconds)}
    </span>
  )
}
