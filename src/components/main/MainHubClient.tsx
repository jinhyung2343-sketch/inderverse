'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HubSettingsButton } from '@/components/navigation/HubSettingsMenu';
import { PageBackLink } from '@/components/navigation/PageBackLink';
import { BRAND } from '@/lib/brand';
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
    description: '작품과 작가 채널을 함께 발견하는 곳',
    path: '/main/explore',
    ambientColor: 'bg-indigo-500', // 블루/퍼플
    glowColor: 'group-hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]',
    borderColor: 'group-hover:border-indigo-500/30'
  },
  {
    id: 'creators',
    title: '작가 채널',
    description: '마음에 드는 작가의 세계를 따라가기',
    path: '/main/explore?view=creators',
    ambientColor: 'bg-violet-500',
    glowColor: 'group-hover:shadow-[0_0_40px_rgba(139,92,246,0.2)]',
    borderColor: 'group-hover:border-violet-500/30'
  },
  {
    id: 'spark',
    title: 'Spark',
    description: '짧고 날카로운 숏폼 만평',
    path: '/main/spark',
    ambientColor: 'bg-sky-500',
    glowColor: 'group-hover:shadow-[0_0_40px_rgba(14,165,233,0.2)]',
    borderColor: 'group-hover:border-sky-500/30'
  },
  {
    id: 'studio',
    title: '작가 스튜디오',
    description: '나만의 우주를 빚어내는 곳',
    path: '/main/studio',
    ambientColor: 'bg-emerald-500', // 그린
    glowColor: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]',
    borderColor: 'group-hover:border-emerald-500/30'
  },
  {
    id: 'community',
    title: '커뮤니티',
    description: '함께 모여 세계를 나누는 광장',
    path: '/community',
    ambientColor: 'bg-cyan-500',
    glowColor: 'group-hover:shadow-[0_0_40px_rgba(6,182,212,0.2)]',
    borderColor: 'group-hover:border-cyan-500/30'
  },
  {
    id: 'library',
    title: '라이브러리',
    description: '내 흔적이 고스란히 담긴 서재',
    path: '/main/library',
    ambientColor: 'bg-rose-500', // 로즈
    glowColor: 'group-hover:shadow-[0_0_40px_rgba(244,63,94,0.2)]',
    borderColor: 'group-hover:border-rose-500/30'
  },
  {
    id: 'store',
    title: '충전하기',
    description: '이야기를 멈추지 않는 원동력',
    path: '/main/store',
    ambientColor: 'bg-amber-500', // 골드
    glowColor: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.2)]',
    borderColor: 'group-hover:border-amber-500/30'
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
  const [isTransitioning, setIsTransitioning] = useState<string | null>(null);
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

  const resolvedIsLoading = isUsingInitialAuth ? false : isLoading;
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

    setIsTransitioning(menuId);
    // 애니메이션 후 라우팅
    setTimeout(() => {
      router.push(path);
    }, 700); // 부드러운 전환을 위한 대기시간
  };

  const handleLoginConfirm = () => {
    if (!loginPrompt) {
      return;
    }

    router.push(getJoinPromptHref(loginPrompt.path));
  };

  const isCreator = resolvedIsLoggedIn && (resolvedProfile?.role === 'creator' || resolvedProfile?.role === 'admin');
  const menus = MENUS.flatMap((menu) => {
    if (menu.id === 'creators') {
      return isCreator
        ? [{
          ...menu,
          id: 'creator-operations',
          title: '내 채널 운영',
          description: '업로드, 편집, 공개 상태를 바로 관리하기',
          path: '/main/studio/creator-channel',
          ambientColor: 'bg-emerald-500',
          glowColor: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]',
          borderColor: 'group-hover:border-emerald-500/30'
        }]
        : [];
    }

    if (menu.id === 'studio') {
      return isCreator
        ? []
        : [{
          ...menu,
          title: '작가 등록',
          description: '창작자로 전환하고 작품을 시작하기'
        }];
    }

    return [menu];
  });
  const activeAmbient = menus.find(m => m.id === hoveredMenu)?.ambientColor || 'bg-white';
  const displayNickname = resolvedIsLoggedIn ? resolvedUserNickname : 'Guest';

  return (
    <main className="relative flex min-h-screen flex-col bg-[#050505] overflow-hidden selection:bg-white/30 text-white">
      
      {/* 
        Background Ambient Light
        마우스 호버에 따라 컬러가 부드럽게 전환됨
      */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 transition-colors duration-1000">
        <div className={`w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full blur-[120px] transition-all duration-1000 ease-out 
          ${hoveredMenu ? `scale-110 opacity-30 ${activeAmbient}` : 'opacity-0 bg-white/5'}
        `} />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 md:p-10 z-30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {/* 뒤로가기 버튼 */}
          <PageBackLink href="/" />
          
          <div className="flex items-center gap-4">
            <span className="text-xl font-black tracking-tighter">{BRAND.name}</span>
            
            {/* 접속 상태 / 닉네임 */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
              {!resolvedIsLoading ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-zinc-400 tracking-wider">접속중 - <span className="text-zinc-200 font-medium">{displayNickname}</span></span>
                </>
              ) : (
                <span className="text-xs text-zinc-500">인증 확인중...</span>
              )}
            </div>
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

      {/* Main Content (Cards Grid) */}
      <div className={`z-20 flex-1 flex flex-col items-center justify-center px-6 transition-all duration-700 ease-in-out
        ${isTransitioning ? 'opacity-0 scale-[3]' : 'opacity-100 scale-100'}
      `}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 w-full max-w-4xl mt-20">
          {resolvedGuardianConsentStatus === 'pending' ? (
            <div className="md:col-span-2 rounded-3xl border border-sky-400/20 bg-sky-500/10 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-100/70">Guardian Consent Pending</p>
              <h2 className="mt-3 text-2xl font-bold text-white">보호자 동의 확인이 진행 중입니다</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-50/80">
                확인이 끝나기 전까지는 충전하기와 작가 스튜디오 기능이 잠시 제한됩니다. 현재 상태는 보호자 동의 확인 안내 화면에서 다시 볼 수 있습니다.
              </p>
              <button
                onClick={() => handleMenuClick('guardian-consent', '/main/guardian-consent')}
                className="mt-5 inline-flex rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                보호자 동의 상태 보기
              </button>
            </div>
          ) : null}

          
          {menus.map((menu, idx) => {
            const isSelected = isTransitioning === menu.id;
            const isOtherTransitioning = isTransitioning && !isSelected;

            return (
              <button
                key={menu.id}
                onClick={() => handleMenuClick(menu.id, menu.path, menu.title)}
                onMouseEnter={() => setHoveredMenu(menu.id)}
                onMouseLeave={() => setHoveredMenu(null)}
                className={`group relative text-left h-40 md:h-56 p-8 rounded-3xl transition-all duration-700 ease-out overflow-hidden
                  ${isOtherTransitioning ? 'opacity-0 scale-90 blur-sm' : ''}
                  ${isSelected ? 'z-50 scale-[1.2]' : 'hover:scale-[1.02]'}
                `}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* 카드 배경 및 Glass 효과 */}
                <div className={`absolute inset-0 border border-white/10 rounded-3xl bg-[#0d0d0d]/60 backdrop-blur-md transition-all duration-500 
                  ${menu.borderColor} ${menu.glowColor}
                `} />

                {/* 카드 내부 컨텐츠 */}
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 group-hover:to-white transition-all">
                      {menu.title}
                    </h2>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <p className="text-sm md:text-base text-zinc-500 font-light tracking-wide group-hover:text-zinc-300 transition-colors">
                      {menu.description}
                    </p>
                    
                    {/* 우측 하단 화살표 아이콘 */}
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 bg-white/5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          
        </div>
      </div>
    </main>
  );
}
