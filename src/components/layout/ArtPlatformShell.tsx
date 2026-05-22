'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import {
  artShellTheme,
  navigationMenu,
  type ArtShellIconName,
  type ArtShellNavigationItem,
  type ArtShellTheme,
} from '@/lib/platform/art-shell-config'

type ArtPlatformShellProps = {
  children: ReactNode
  eyebrow?: string
  title?: string
  description?: string
  actions?: ReactNode
  navigation?: ArtShellNavigationItem[]
  theme?: ArtShellTheme
}

type ShellStyle = CSSProperties & {
  '--shell-primary': string
  '--shell-secondary': string
  '--shell-canvas': string
  '--shell-panel': string
}

const iconStrokeByName: Record<ArtShellIconName, string> = {
  home: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.6 5.4-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1Z',
  studio: 'M4 20h16M7 17l9.5-9.5 2 2L9 19H7v-2Zm8-11 1.5-1.5a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L18 9',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  spark: 'M13 2 7 13h5l-1 9 6-12h-5l1-8Z',
  library: 'M5 4h10a4 4 0 0 1 4 4v12H8a3 3 0 0 1-3-3V4Zm3 0v13a3 3 0 0 0-3 3',
  billing: 'M4 7h16v10H4V7Zm0 3h16M8 15h3',
}

function ShellIcon({ name }: { name: ArtShellIconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
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
  if (href === '/') {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function BrandMark({ theme }: { theme: ArtShellTheme }) {
  return (
    <Link href="/main" className="group flex min-w-0 items-center gap-3" aria-label={`${theme.brandName} 홈`}>
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.07] shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-500 ease-out group-hover:scale-[1.04] group-hover:border-white/25">
        {theme.logoPath ? (
          <Image src={theme.logoPath} alt="" fill sizes="44px" className="object-cover" priority />
        ) : (
          <span className="text-sm font-black text-white">{theme.brandName.slice(0, 2).toUpperCase()}</span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black tracking-tight text-white">{theme.brandName}</span>
        <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.24em] text-zinc-500">
          {theme.brandCaption}
        </span>
      </span>
    </Link>
  )
}

function NavigationLink({
  item,
  isActive,
}: {
  item: ArtShellNavigationItem
  isActive: boolean
}) {
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-all duration-500 ease-out ${
        isActive
          ? 'border-white/20 bg-white/[0.12] text-white shadow-[0_18px_55px_rgba(159,122,234,0.18)]'
          : 'border-transparent text-zinc-400 hover:scale-[1.015] hover:border-white/15 hover:bg-white/[0.07] hover:text-white hover:shadow-[0_18px_55px_rgba(45,212,191,0.10)]'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-500 ease-out ${
          isActive
            ? 'border-white/20 bg-white/[0.14] text-white'
            : 'border-white/10 bg-black/20 text-zinc-500 group-hover:border-white/20 group-hover:text-white'
        }`}
      >
        <ShellIcon name={item.icon} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{item.name}</span>
        {item.description ? (
          <span className="mt-0.5 block truncate text-xs text-zinc-500 transition-colors duration-500 group-hover:text-zinc-400">
            {item.description}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

export function ArtPlatformShell({
  children,
  eyebrow = 'Creative Platform',
  title = 'A flexible canvas for independent worlds',
  description = 'A reusable shell for creative pages, built around generous spacing, glass panels, and theme variables that can shift with the product.',
  actions,
  navigation = navigationMenu,
  theme = artShellTheme,
}: ArtPlatformShellProps) {
  const pathname = usePathname()
  const shellStyle: ShellStyle = {
    '--shell-primary': theme.primaryColor,
    '--shell-secondary': theme.secondaryColor,
    '--shell-canvas': theme.canvasColor,
    '--shell-panel': theme.panelColor,
  }

  return (
    <main
      style={shellStyle}
      className="relative min-h-[100dvh] overflow-hidden bg-[var(--shell-canvas)] text-white selection:bg-white/25"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_28%,rgba(0,0,0,0)_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative z-10 grid min-h-[100dvh] lg:grid-cols-[288px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-[color-mix(in_srgb,var(--shell-panel)_70%,transparent)] px-5 py-6 backdrop-blur-2xl lg:block">
          <BrandMark theme={theme} />
          <nav className="mt-9 grid gap-2">
            {navigation.map((item) => (
              <NavigationLink key={item.href} item={item} isActive={isActivePath(pathname, item.href)} />
            ))}
          </nav>

          <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.05] p-4 text-xs leading-6 text-zinc-400 backdrop-blur-xl">
            <p className="font-semibold uppercase tracking-[0.22em] text-zinc-500">Theme Tokens</p>
            <p className="mt-3">Logo, colors, and navigation are driven by one config object.</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[color-mix(in_srgb,var(--shell-canvas)_76%,transparent)] px-5 py-4 backdrop-blur-2xl md:px-8 lg:hidden">
            <BrandMark theme={theme} />
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {navigation.map((item) => {
                const isActive = isActivePath(pathname, item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-500 ease-out ${
                      isActive
                        ? 'border-white/20 bg-white/[0.12] text-white'
                        : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <ShellIcon name={item.icon} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </header>

          <div className="flex flex-1 flex-col px-5 py-8 md:px-8 md:py-10 xl:px-12">
            <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">{eyebrow}</p>
                <h1 className="mt-4 text-4xl font-black leading-[0.98] tracking-tight text-white md:text-6xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base md:leading-8">
                  {description}
                </p>
              </div>
              {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
            </header>

            <div className="flex-1 py-8 md:py-10">{children}</div>
          </div>
        </section>
      </div>
    </main>
  )
}
