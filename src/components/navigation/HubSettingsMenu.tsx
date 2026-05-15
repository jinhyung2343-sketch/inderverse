'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageBackLink } from '@/components/navigation/PageBackLink'
import { useAuthStore } from '@/stores/auth'

type SettingsItem =
  | {
      kind: 'link'
      label: string
      description: string
      href: string
      tone?: 'default' | 'danger'
      visible?: boolean
    }
  | {
      kind: 'action'
      label: string
      description: string
      action: () => void
      disabled?: boolean
      tone?: 'default' | 'danger'
      visible?: boolean
    }
  | {
      kind: 'pending'
      label: string
      description: string
      tone?: 'default' | 'danger'
      visible?: boolean
    }

interface SettingsSection {
  title: string
  items: SettingsItem[]
}

type SettingsConfirmDialog = 'sign-out' | 'withdrawal' | null

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.38a1.7 1.7 0 0 0-1 .62 1.7 1.7 0 0 0-.4 1.08V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.62 15a1.7 1.7 0 0 0-.62-1 1.7 1.7 0 0 0-1.08-.4H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 5 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.62a1.7 1.7 0 0 0 1-.62A1.7 1.7 0 0 0 10.4 3V3a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15.4 5a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.38 9c.16.39.39.72.62 1 .28.26.66.4 1.08.4H21a2 2 0 0 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  )
}

function getItemClassName(item: SettingsItem) {
  const toneClass =
    item.tone === 'danger'
      ? 'text-rose-200 hover:border-rose-300/30 hover:bg-rose-500/10'
      : 'text-zinc-200 hover:border-white/20 hover:bg-white/10'

  return `block w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-left transition ${toneClass}`
}

function SettingsMenuItem({ item }: { item: SettingsItem }) {
  if (item.kind === 'link') {
    return (
      <Link href={item.href} className={getItemClassName(item)}>
        <span className="block text-sm font-semibold">{item.label}</span>
        <span className="mt-1 block text-xs leading-5 text-zinc-500">{item.description}</span>
      </Link>
    )
  }

  if (item.kind === 'action') {
    return (
      <button
        type="button"
        onClick={item.action}
        disabled={item.disabled}
        className={`${getItemClassName(item)} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="block text-sm font-semibold">{item.label}</span>
        <span className="mt-1 block text-xs leading-5 text-zinc-500">{item.description}</span>
      </button>
    )
  }

  return (
    <div className={`${getItemClassName(item)} cursor-not-allowed opacity-70`}>
      <span className="flex items-center justify-between gap-3 text-sm font-semibold">
        {item.label}
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Soon
        </span>
      </span>
      <span className="mt-1 block text-xs leading-5 text-zinc-500">{item.description}</span>
    </div>
  )
}

export function HubSettingsButton() {
  return (
    <Link
      href="/main/settings"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
      aria-label="설정"
    >
      <GearIcon />
    </Link>
  )
}

export function SettingsPageClient() {
  const router = useRouter()
  const {
    checkSession,
    isLoggedIn,
    profile,
    userNickname,
    signOut,
  } = useAuthStore()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<SettingsConfirmDialog>(null)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const isCreator = isLoggedIn && (profile?.role === 'creator' || profile?.role === 'admin')
  const displayNickname = isLoggedIn ? userNickname : 'Guest'

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)

    try {
      await signOut()
      router.push('/')
      router.refresh()
    } finally {
      setIsSigningOut(false)
      setConfirmDialog(null)
    }
  }, [isSigningOut, router, signOut])

  const closeConfirmDialog = useCallback(() => {
    if (!isSigningOut) {
      setConfirmDialog(null)
    }
  }, [isSigningOut])

  const sections = useMemo<SettingsSection[]>(() => {
    const authNextPath = encodeURIComponent('/main')

    return [
      {
        title: '계정',
        items: isLoggedIn
          ? [
              {
                kind: 'pending',
                label: '프로필 관리',
                description: '닉네임과 계정 표시 정보를 관리합니다.',
              },
              {
                kind: 'link',
                label: '비밀번호 변경',
                description: '이메일 인증코드로 새 비밀번호를 설정합니다.',
                href: `/auth/forgot-password?next=${authNextPath}`,
              },
              {
                kind: 'action',
                label: isSigningOut ? '로그아웃 중...' : '로그아웃',
                description: '현재 기기에서 인더버스 접속을 종료합니다.',
                action: () => setConfirmDialog('sign-out'),
                disabled: isSigningOut,
              },
              {
                kind: 'action',
                label: '회원 탈퇴',
                description: '결제, 정산, 작성 콘텐츠 확인 절차가 필요한 메뉴입니다.',
                action: () => setConfirmDialog('withdrawal'),
                tone: 'danger',
              },
            ]
          : [
              {
                kind: 'link',
                label: '로그인',
                description: '계정으로 이어서 이용합니다.',
                href: `/auth/sign-in?next=${authNextPath}`,
              },
              {
                kind: 'link',
                label: '회원가입',
                description: '인더버스 계정을 새로 만듭니다.',
                href: `/auth/sign-up?next=${authNextPath}`,
              },
            ],
      },
      {
        title: '알림',
        items: [
          {
            kind: 'pending',
            label: '이메일 알림',
            description: '작품 업데이트, 공지, 추천 메일 수신 여부를 관리합니다.',
          },
          {
            kind: 'pending',
            label: '푸시 알림',
            description: '브라우저와 기기별 알림 설정을 관리합니다.',
          },
        ],
      },
      {
        title: '작가',
        items: isCreator
          ? [
              {
                kind: 'link',
                label: '내 채널 운영',
                description: '작품 업로드, 편집, 공개 상태를 관리합니다.',
                href: '/main/studio/creator-channel',
              },
              {
                kind: 'link',
                label: '정산 확인',
                description: '작품별 수익과 정산 상태를 확인합니다.',
                href: '/main/studio/settlements',
              },
            ]
          : [
              {
                kind: 'link',
                label: '작가 등록',
                description: '창작자로 전환하고 작품 운영을 시작합니다.',
                href: '/main/studio',
              },
            ],
      },
      {
        title: '지원',
        items: [
          {
            kind: 'link',
            label: '공지 · 의견',
            description: '공지와 피드백 메뉴로 이동합니다.',
            href: '/community',
          },
          {
            kind: 'pending',
            label: '약관 및 개인정보',
            description: '서비스 정책 문서를 한곳에서 확인하는 메뉴입니다.',
          },
        ],
      },
    ]
  }, [isCreator, isLoggedIn, isSigningOut])

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-7">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <PageBackLink href="/main" ariaLabel="허브로 돌아가기" showLabel />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Settings</p>
        </header>

        <section className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">설정</h1>
          <p className="text-sm leading-7 text-zinc-400 md:text-base">
            {displayNickname} 계정의 접속, 알림, 작가 활동, 지원 메뉴를 관리합니다.
          </p>
        </section>

        <div className="grid gap-5">
          {sections.map((section) => {
            const visibleItems = section.items.filter((item) => item.visible !== false)

            if (visibleItems.length === 0) {
              return null
            }

            return (
              <section key={section.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                  {section.title}
                </h2>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {visibleItems.map((item) => (
                    <SettingsMenuItem key={`${section.title}-${item.label}`} item={item} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {confirmDialog ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-confirm-title"
        >
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#080808] p-6 shadow-2xl shadow-black/60">
            {confirmDialog === 'sign-out' ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Sign Out</p>
                <h2 id="settings-confirm-title" className="mt-4 text-2xl font-bold tracking-tight text-white">
                  로그아웃을 진행하시겠습니까?
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  현재 기기에서 인더버스 접속이 종료됩니다. 저장하지 않은 작성 내용이 있다면 먼저 저장해 주세요.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closeConfirmDialog}
                    disabled={isSigningOut}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? '로그아웃 중...' : '로그아웃'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300/70">Account Deletion</p>
                <h2 id="settings-confirm-title" className="mt-4 text-2xl font-bold tracking-tight text-white">
                  회원 탈퇴를 진행하시겠습니까?
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  회원 탈퇴가 완료되면 계정 정보, 라이브러리 기록, 작가 채널, 작품 데이터, 정산 관련 정보에 영향을 줄 수 있습니다.
                  결제와 정산, 작성 콘텐츠 확인 절차가 필요하므로 현재는 자동 탈퇴 대신 안내 단계로 제공됩니다.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closeConfirmDialog}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={closeConfirmDialog}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-rose-300/30 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/25"
                  >
                    안내 확인
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  )
}
