import { LandingStartLink } from '@/components/auth/LandingStartLink';
import { BRAND } from '@/lib/brand';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const startHref = user ? '/main' : '/join-prompt?next=%2Fmain'

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
        <LandingStartLink initialHref={startHref} />
      </div>
    </main>
  );
}
