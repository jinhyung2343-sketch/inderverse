import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] overflow-hidden selection:bg-white/30">
      
      {/* Background ambient subtle light */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        <div className="w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-white/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Central Logo Placeholder */}
      <div className="z-10 flex flex-col items-center justify-center flex-1">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white animate-fade-in">
          {BRAND.name}
        </h1>
        <p 
          className="mt-6 text-zinc-400 font-light tracking-[0.2em] text-xs md:text-sm animate-fade-in opacity-0" 
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
        >
          독립 창작의 주도권을 되찾는 세계
        </p>
      </div>

      {/* Bottom Start Button */}
      <div 
        className="z-10 w-full flex justify-center pb-24 md:pb-32 animate-slide-up opacity-0" 
        style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
      >
        <Link
          href="/join-prompt?next=%2Fmain"
          prefetch
          className="group relative inline-flex items-center justify-center px-12 py-4 font-medium text-white transition-all duration-700 ease-out"
        >
          {/* Base Button Background with Glassmorphism & Glow */}
          <span className="absolute inset-0 w-full h-full border border-white/10 rounded-full bg-white/5 backdrop-blur-sm transition-all duration-700 ease-out group-hover:bg-white/10 group-hover:border-white/30 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] group-active:scale-95"></span>
          
          {/* Text */}
          <span className="relative tracking-widest text-sm transition-transform duration-700 group-hover:scale-105">
            시작하기
          </span>
        </Link>
      </div>
    </main>
  );
}
