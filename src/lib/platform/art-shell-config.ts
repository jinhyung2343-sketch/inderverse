export type ArtShellIconName =
  | 'home'
  | 'compass'
  | 'studio'
  | 'profile'
  | 'spark'
  | 'library'
  | 'billing'

export type ArtShellNavigationItem = {
  name: string
  href: string
  icon: ArtShellIconName
  description?: string
}

export type ArtShellTheme = {
  logoPath: string
  brandName: string
  brandCaption: string
  primaryColor: string
  secondaryColor: string
  canvasColor: string
  panelColor: string
}

export const artShellTheme: ArtShellTheme = {
  logoPath: '',
  brandName: 'inderverse',
  brandCaption: 'Creative Network',
  primaryColor: '#9f7aea',
  secondaryColor: '#2dd4bf',
  canvasColor: '#080a10',
  panelColor: '#111827',
}

export const navigationMenu: ArtShellNavigationItem[] = [
  {
    name: 'Feed',
    href: '/main',
    icon: 'home',
    description: '오늘의 창작 흐름',
  },
  {
    name: 'Discover',
    href: '/main/explore',
    icon: 'compass',
    description: '작품과 작가 탐색',
  },
  {
    name: 'Studio',
    href: '/main/studio',
    icon: 'studio',
    description: '창작 공방',
  },
  {
    name: 'Spark',
    href: '/main/spark',
    icon: 'spark',
    description: '짧은 아이디어',
  },
  {
    name: 'Library',
    href: '/main/library',
    icon: 'library',
    description: '내 서재',
  },
  {
    name: 'Billing',
    href: '/main/store',
    icon: 'billing',
    description: '구독과 인더륨',
  },
  {
    name: 'Profile',
    href: '/main/settings',
    icon: 'profile',
    description: '계정과 설정',
  },
]
