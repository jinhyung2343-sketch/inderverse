import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

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
    template: '%s | InDeTune',
    default: 'InDeTune - 인더튠',
  },
  description: '독립 작가 중심의 고품질 웹툰 플랫폼',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '인더튠',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-bg-dark text-foreground selection:bg-primary-500/30">
        <div className="flex-1 w-full max-w-screen-md mx-auto relative shadow-2xl bg-bg-card ring-1 ring-white/5">
          {/* 하단 탭바 여백 확보를 위한 pb (모바일 기준) */}
          <main className="min-h-[100dvh] pb-16">
            {children}
          </main>
          {/* 이후 여기에 BottomNavigation 컴포넌트 추가 */}
        </div>
      </body>
    </html>
  )
}
