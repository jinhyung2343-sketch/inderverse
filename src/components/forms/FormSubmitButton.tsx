'use client'

import { useFormStatus } from 'react-dom'

export function FormSubmitButton({
  className,
  label,
  pendingLabel = '저장 중',
}: {
  className: string
  label: string
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  )
}
