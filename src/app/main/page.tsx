'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { useAuthStore } from '@/stores/auth';

const MENUS = [
  {
    id: 'explore',
    title: '작품보기',
    description: '무한한 세계로 빠져들 시간',
    path: '/main/explore',
    ambientColor: 'bg-indigo-500', // 블루/퍼플
    glowColor: 'group-hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]',
    borderColor: 'group-hover:border-indigo-500/30'
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

export default function MainHubPage() {
  const router = useRouter();
  const {
    isLoading,
    checkSession,
    isLoggedIn,
    userNickname,
    guardianConsentStatus,
    signOut,
  } = useAuthStore();
  
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  // 컴포넌트 마운트 시 세션 체크
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleMenuClick = (menuId: string, path: string) => {
    // 권한 가드 로직: 작품 탐색이 아니고 로그인 안된 경우 차단
    if (menuId !== 'explore' && menuId !== 'spark' && !isLoggedIn) {
      setToast({
        id: Date.now(),
        message: '몰입을 위해 로그인이 필요한 서비스입니다.',
      });
      return;
    }

    setIsTransitioning(menuId);
    // 애니메이션 후 라우팅
    setTimeout(() => {
      router.push(path);
    }, 700); // 부드러운 전환을 위한 대기시간
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      router.push('/');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  const activeAmbient = MENUS.find(m => m.id === hoveredMenu)?.ambientColor || 'bg-white';
  const displayNickname = isLoggedIn ? userNickname : 'Guest';

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
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md"
            aria-label="뒤로 가기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-xl font-black tracking-tighter">{BRAND.name}</span>
            
            {/* 접속 상태 / 닉네임 */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
              {!isLoading ? (
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

        {isLoggedIn ? (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        ) : null}
      </header>

      {toast ? (
        <div
          key={toast.id}
          className="fixed left-1/2 top-24 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-3xl border border-white/10 bg-[#050505]/85 px-5 py-4 text-center text-sm font-medium text-white shadow-2xl shadow-black/40 backdrop-blur animate-in fade-in slide-in-from-top-3 duration-200"
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ) : null}

      {/* Main Content (Cards Grid) */}
      <div className={`z-20 flex-1 flex flex-col items-center justify-center px-6 transition-all duration-700 ease-in-out
        ${isTransitioning ? 'opacity-0 scale-[3]' : 'opacity-100 scale-100'}
      `}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 w-full max-w-4xl mt-20">
          {guardianConsentStatus === 'pending' ? (
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

          
          {MENUS.map((menu, idx) => {
            const isSelected = isTransitioning === menu.id;
            const isOtherTransitioning = isTransitioning && !isSelected;

            return (
              <button
                key={menu.id}
                onClick={() => handleMenuClick(menu.id, menu.path)}
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
