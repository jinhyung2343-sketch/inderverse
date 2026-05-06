import Link from 'next/link'

export function PageBackLink({
  href,
  ariaLabel = '뒤로 가기',
}: {
  href: string
  ariaLabel?: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white text-black shadow-lg shadow-black/30 backdrop-blur-xl transition hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/50"
      aria-label={ariaLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </Link>
  )
}
