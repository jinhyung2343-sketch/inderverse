import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { BottomNavigation } from '@/components/navigation/BottomNavigation'
import { BRAND } from '@/lib/brand'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    template: `%s | ${BRAND.name}`,
    default: `${BRAND.name} - ${BRAND.koreanName}`,
  },
  description: BRAND.description,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: BRAND.koreanName,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="ko" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-bg-dark text-foreground selection:bg-primary-500/30">
        <div className="flex-1 w-full max-w-screen-md mx-auto relative shadow-2xl bg-bg-card ring-1 ring-white/5">
          <main className="min-h-[100dvh] pb-24">
            {children}
          </main>
          <BottomNavigation />
        </div>
      </body>
    </html>
  )
}
