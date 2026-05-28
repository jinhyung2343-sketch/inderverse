'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HubSettingsButton } from '@/components/navigation/HubSettingsMenu';
import { PageBackLink } from '@/components/navigation/PageBackLink';
import { canGuestOpenMainMenu, getJoinPromptHref, LOGIN_REQUIRED_MESSAGE } from '@/lib/guest-policy';
import { useAuthStore } from '@/stores/auth';
import type { Database } from '@/lib/supabase/types';

type HubProfile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'role' | 'is_adult_verified' | 'guardian_consent_status' | 'display_name'
> | null;

export type InitialHubAuth = {
  isLoggedIn: boolean;
  userNickname: string;
  profile: HubProfile;
  guardianConsentStatus: string | null;
};

const MENUS = [
  {
    id: 'explore',
    title: '작품보기',
    path: '/main/explore',
    wash: 'from-violet-500/20 via-white/[0.03] to-transparent',
    dot: 'bg-violet-300',
    text: 'group-hover:text-violet-100',
  },
  {
    id: 'creators',
    title: '작가보기',
    path: '/main/explore?view=creators',
    wash: 'from-fuchsia-500/20 via-white/[0.03] to-transparent',
    dot: 'bg-fuchsia-300',
    text: 'group-hover:text-fuchsia-100',
  },
  {
    id: 'spark',
    title: 'Spark',
    path: '/main/spark',
    wash: 'from-sky-500/20 via-white/[0.03] to-transparent',
    dot: 'bg-sky-300',
    text: 'group-hover:text-sky-100',
  },
  {
    id: 'studio',
    title: 'Bottega',
    path: '/main/studio',
    wash: 'from-emerald-500/20 via-white/[0.03] to-transparent',
    dot: 'bg-emerald-300',
    text: 'group-hover:text-emerald-100',
  },
  {
    id: 'community',
    title: '커뮤니티',
    path: '/community',
    wash: 'from-cyan-500/20 via-white/[0.03] to-transparent',
    dot: 'bg-cyan-300',
    text: 'group-hover:text-cyan-100',
  },
  {
    id: 'library',
    title: '라이브러리',
    path: '/main/library',
    wash: 'from-rose-500/20 via-white/[0.03] to-transparent',
    dot: 'bg-rose-300',
    text: 'group-hover:text-rose-100',
  },
  {
    id: 'store',
    title: '구독과 인더륨',
    path: '/main/store',
    wash: 'from-amber-500/20 via-white/[0.03] to-transparent',
    dot: 'bg-amber-300',
    text: 'group-hover:text-amber-100',
  }
];

export function MainHubClient({ initialAuth }: { initialAuth: InitialHubAuth }) {
  const router = useRouter();
  const {
    isLoading,
    checkSession,
    isLoggedIn,
    profile,
    userNickname,
    guardianConsentStatus,
  } = useAuthStore();
  
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [loginPrompt, setLoginPrompt] = useState<{ title: string; path: string } | null>(null);
  const [isUsingInitialAuth, setIsUsingInitialAuth] = useState(true);

  // 컴포넌트 마운트 시 세션 체크
  useEffect(() => {
    let isMounted = true;

    checkSession().finally(() => {
      if (isMounted) {
        setIsUsingInitialAuth(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [checkSession]);

  const resolvedIsLoading = isUsingInitialAuth ? false : isLoading && isLoggedIn;
  const resolvedIsLoggedIn = isUsingInitialAuth ? initialAuth.isLoggedIn : isLoggedIn;
  const resolvedProfile = isUsingInitialAuth ? initialAuth.profile : profile;
  const resolvedUserNickname = isUsingInitialAuth ? initialAuth.userNickname : userNickname;
  const resolvedGuardianConsentStatus = isUsingInitialAuth
    ? initialAuth.guardianConsentStatus
    : guardianConsentStatus;

  const handleMenuClick = (menuId: string, path: string, title?: string) => {
    // 게스트는 읽기/탐색/모니터링 메뉴까지만 진입할 수 있습니다.
    if (!canGuestOpenMainMenu(menuId) && !resolvedIsLoggedIn) {
      setLoginPrompt({ title: title ?? '이 메뉴', path });
      return;
    }

    router.push(path);
  };

  const handleLoginConfirm = () => {
    if (!loginPrompt) {
      return;
    }

    router.push(getJoinPromptHref(loginPrompt.path));
  };

  const isCreator = resolvedIsLoggedIn && (resolvedProfile?.role === 'creator' || resolvedProfile?.role === 'admin');
  const menus = MENUS.flatMap((menu) => {
    if (menu.id === 'studio') {
      return isCreator
        ? [{
          ...menu,
          title: 'My Bottega',
        }]
        : [{
          ...menu,
          title: 'Bottega',
        }];
    }

    return [menu];
  });
  const displayNickname = resolvedIsLoggedIn ? resolvedUserNickname : 'Guest';

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#050608] text-white selection:bg-white/30">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.09),rgba(255,255,255,0.01)_34%,rgba(20,184,166,0.08)_64%,rgba(244,114,182,0.06))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Header */}
      <header className="absolute left-0 top-0 z-30 flex w-full items-center justify-between gap-3 p-5 md:p-10">
        <div className="flex min-w-0 items-center gap-3 md:gap-5">
          <PageBackLink href="/" />

          <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-md md:px-4">
            {!resolvedIsLoading ? (
              <>
                <span className={`h-2 w-2 shrink-0 rounded-full ${resolvedIsLoggedIn ? 'bg-emerald-300' : 'bg-zinc-400'}`} />
                <span className="truncate text-xs font-semibold text-zinc-100 md:text-sm">
                  {displayNickname}
                </span>
                <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:inline">
                  {resolvedIsLoggedIn ? 'Online' : 'Guest'}
                </span>
              </>
            ) : (
              <span className="text-xs text-zinc-500">인증 확인중...</span>
            )}
          </div>
        </div>

        <HubSettingsButton />
      </header>

      {loginPrompt ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-required-title"
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#080808] p-6 text-center shadow-2xl shadow-black/50">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Login Required</p>
            <h2 id="login-required-title" className="mt-4 text-2xl font-bold tracking-tight text-white">
              {LOGIN_REQUIRED_MESSAGE}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {loginPrompt.title} 메뉴는 로그인 후 사용할 수 있습니다.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLoginPrompt(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleLoginConfirm}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="relative z-20 flex flex-1 items-center px-5 py-28 md:px-10 md:py-32">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.42em] text-zinc-500">Hub</p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-none tracking-normal text-white md:text-7xl">
                Inderverse
              </h1>
            </div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-zinc-500">
              <span className="h-px w-10 bg-white/20" />
              <span>{resolvedIsLoggedIn ? 'Member' : 'Guest'}</span>
            </div>
          </div>

          {resolvedGuardianConsentStatus === 'pending' ? (
            <div className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-5 backdrop-blur-md md:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-100/70">Guardian Consent Pending</p>
              <h2 className="mt-3 text-2xl font-bold text-white">보호자 동의 확인이 진행 중입니다</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-50/80">
                확인이 끝나기 전까지는 구독·인더륨 결제와 Bottega 개설 기능이 잠시 제한됩니다. 현재 상태는 보호자 동의 확인 안내 화면에서 다시 볼 수 있습니다.
              </p>
              <button
                onClick={() => router.push('/main/guardian-consent')}
                className="mt-5 inline-flex rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                보호자 동의 상태 보기
              </button>
            </div>
          ) : null}

          <nav className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl md:grid-cols-2 xl:grid-cols-3" aria-label="주요 메뉴">
            {menus.map((menu, idx) => {
              const canOpenMenu = canGuestOpenMainMenu(menu.id) || resolvedIsLoggedIn;
              const isHovered = hoveredMenu === menu.id;
              const menuClassName = `group relative flex min-h-[132px] flex-col justify-between overflow-hidden bg-[#08090b]/85 p-6 text-left transition-all duration-500 ease-out hover:z-10 hover:scale-[1.015] hover:bg-[#101216]/90 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/70 active:scale-[0.99] md:min-h-[190px] md:p-8`;
              const menuNumber = String(idx + 1).padStart(2, '0');
              const accessibleMenuLabel = `${idx + 1}번 ${menu.title}`;

              const menuContent = (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${menu.wash} opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 ${isHovered ? 'opacity-100' : ''}`} />
                  <div className="relative z-10 flex justify-end" aria-hidden="true">
                    <span className={`h-2 w-2 rounded-full ${menu.dot} opacity-70 transition-all duration-500 ease-out group-hover:scale-125 group-hover:opacity-100`} />
                  </div>
                  <div className="relative z-10 flex items-end justify-between gap-4">
                    <div className="flex min-w-0 items-baseline gap-3 md:gap-4" aria-hidden="true">
                      <span className="shrink-0 text-xs font-semibold tracking-[0.2em] text-zinc-500 transition-colors duration-500 ease-out group-hover:text-zinc-300 md:text-sm">
                        {menuNumber}
                      </span>
                      <h2 className={`break-keep text-3xl font-black leading-none tracking-normal text-zinc-100 transition-all duration-500 ease-out ${menu.text} group-hover:translate-x-1 md:text-5xl`}>
                        {menu.title}
                      </h2>
                    </div>
                    <span className="mb-1 flex h-9 w-9 shrink-0 translate-x-2 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 opacity-0 transition-all duration-500 ease-out group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </>
              );

              return canOpenMenu ? (
                <Link
                  key={menu.id}
                  href={menu.path}
                  prefetch
                  onMouseEnter={() => {
                    setHoveredMenu(menu.id);
                    router.prefetch(menu.path);
                  }}
                  onFocus={() => {
                    setHoveredMenu(menu.id);
                    router.prefetch(menu.path);
                  }}
                  onMouseLeave={() => setHoveredMenu(null)}
                  onBlur={() => setHoveredMenu(null)}
                  className={menuClassName}
                  aria-label={accessibleMenuLabel}
                >
                  {menuContent}
                </Link>
              ) : (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => handleMenuClick(menu.id, menu.path, menu.title)}
                  onMouseEnter={() => setHoveredMenu(menu.id)}
                  onFocus={() => setHoveredMenu(menu.id)}
                  onMouseLeave={() => setHoveredMenu(null)}
                  onBlur={() => setHoveredMenu(null)}
                  className={menuClassName}
                  aria-label={accessibleMenuLabel}
                >
                  {menuContent}
                </button>
              );
            })}
          </nav>
        </div>
      </section>
    </main>
  );
}
