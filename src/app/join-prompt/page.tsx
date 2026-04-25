'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';

export default function JoinPromptPage() {
  const router = useRouter();

  const handleSignUp = () => {
    router.push('/auth/sign-up');
  };

  const handleGuest = () => {
    // 상태 변경 없이 바로 메인으로 이동
    router.push('/main');
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] overflow-hidden text-white selection:bg-white/30 px-6">
      <header className="absolute left-0 top-0 z-20 w-full p-6 md:p-8">
        <Link
          href="/"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10"
          aria-label="뒤로 가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
      </header>

      
      {/* Background ambient subtle light */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-white/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="z-10 flex flex-col items-center max-w-md w-full gap-8 text-center animate-fade-in">
        
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            {BRAND.name}에 오신 것을 환영합니다
          </h1>
          <p className="text-zinc-400 font-light text-sm md:text-base leading-relaxed">
            거대 플랫폼의 규칙이 아니라 작가와 독자가 직접 흐름을 만드는 공간입니다.<br/>
            가입 후 작품 탐색, 후원, 라이브러리 기능을 이어서 사용할 수 있어요.
          </p>
        </div>

        <div className="w-full flex flex-col gap-4 mt-4">
          <button 
            onClick={handleSignUp}
            className="w-full py-4 rounded-xl bg-white text-black font-semibold tracking-wide hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98]"
          >
            회원가입
          </button>
          
          <button 
            onClick={handleGuest}
            className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-medium hover:bg-white/10 transition-colors hover:scale-[1.02] active:scale-[0.98]"
          >
            아니요 (게스트로 계속)
          </button>
        </div>
        
      </div>
    </main>
  )
}
