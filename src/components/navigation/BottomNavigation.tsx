'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'
import { navigationMenu, type ArtShellIconName } from '@/lib/platform/art-shell-config'

type BottomNavigationItem = {
  name: string
  href: string
  icon: ArtShellIconName
  label: string
}

const bottomNavigationLabels: Record<string, string> = {
  '/main': '홈',
  '/main/explore': '탐색',
  '/main/studio': '스튜디오',
  '/main/library': '서재',
  '/main/store': '충전',
}

const bottomNavigationItems: BottomNavigationItem[] = navigationMenu
  .filter((item) => ['/main', '/main/explore', '/main/spark', '/main/studio', '/main/library', '/main/store'].includes(item.href))
  .map((item) => ({
    ...item,
    label: bottomNavigationLabels[item.href] ?? item.name,
  }))

const iconStrokeByName: Record<ArtShellIconName, string> = {
  home: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.6 5.4-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1Z',
  studio: 'M4 20h16M7 17l9.5-9.5 2 2L9 19H7v-2Zm8-11 1.5-1.5a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L18 9',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  spark: 'M13 2 7 13h5l-1 9 6-12h-5l1-8Z',
  library: 'M5 4h10a4 4 0 0 1 4 4v12H8a3 3 0 0 1-3-3V4Zm3 0v13a3 3 0 0 0-3 3',
  billing: 'M4 7h16v10H4V7Zm0 3h16M8 15h3',
}

const navStyle: CSSProperties = {
  position: 'fixed',
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 50,
  width: '100%',
  maxWidth: '768px',
  margin: '0 auto',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(11,13,18,0.9)',
  padding: '0.5rem 0.5rem max(env(safe-area-inset-bottom), 0.5rem)',
  boxShadow: '0 -18px 55px rgba(0,0,0,0.34)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: '0.25rem',
}

const linkBaseStyle: CSSProperties = {
  display: 'flex',
  minWidth: 0,
  height: '3.5rem',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.25rem',
  borderRadius: '0.5rem',
  fontSize: '10px',
  fontWeight: 600,
  lineHeight: 1,
  transition: 'background 180ms ease, color 180ms ease, transform 180ms ease',
}

const activeLinkStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.12)',
  color: '#ffffff',
  boxShadow: '0 12px 34px rgba(34,197,94,0.14)',
}

const inactiveLinkStyle: CSSProperties = {
  color: '#71717a',
}

function BottomNavigationIcon({ name }: { name: ArtShellIconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={iconStrokeByName[name]} />
    </svg>
  )
}

function isActivePath(pathname: string, href: string) {
  if (href === '/main') {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function BottomNavigation() {
  const pathname = usePathname()

  if (!pathname.startsWith('/main')) {
    return null
  }

  return (
    <nav
      aria-label="주요 메뉴"
      className="backdrop-blur-2xl"
      style={navStyle}
    >
      <div style={gridStyle}>
        {bottomNavigationItems.map((item) => {
          const isActive = isActivePath(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className="group hover:bg-white/[0.07] hover:text-zinc-200"
              style={{ ...linkBaseStyle, ...(isActive ? activeLinkStyle : inactiveLinkStyle) }}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center transition-transform duration-300 ${
                  isActive ? 'scale-105 text-primary-500' : 'group-hover:-translate-y-0.5'
                }`}
              >
                <BottomNavigationIcon name={item.icon} />
              </span>
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
