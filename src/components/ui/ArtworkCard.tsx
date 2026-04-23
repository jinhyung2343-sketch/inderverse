import React from 'react';
import Image from 'next/image';

interface ArtworkCardProps {
  id: string;
  title: string;
  authorName: string;
  coverImageUrl: string;
  status: 'publishing' | 'completed';
  isAdultOnly: boolean;
  // 작가주의 시스템: 댓글 활성화 여부 표기 (Mock)
  isCommentEnabled?: boolean;
}

export function ArtworkCard({
  title,
  authorName,
  coverImageUrl,
  status,
  isAdultOnly,
  isCommentEnabled = true
}: ArtworkCardProps) {
  return (
    <div className="group relative flex flex-col gap-3 min-w-[160px] md:min-w-[200px] cursor-pointer">
      {/* 썸네일 컨테이너 */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-bg-card transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:shadow-2xl">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 160px, 200px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-600">
            No Image
          </div>
        )}

        {/* 뱃지들: 성인, 완결 등 */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isAdultOnly && (
            <span className="rounded bg-red-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
              19
            </span>
          )}
          {status === 'completed' && (
            <span className="rounded bg-primary-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
              완결
            </span>
          )}
        </div>

        {/* 하단 그라데이션 오버레이 (Hover 시 나타남) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4">
           {/* 댓글 활성여부 인디케이터 (작가주의) */}
           <div className="flex items-center gap-1.5 transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
             {isCommentEnabled ? (
                <span className="flex items-center text-xs text-zinc-300">
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  댓글 켬
                </span>
             ) : (
               <span className="flex items-center text-xs text-red-300">
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  댓글 끔
                </span>
             )}
           </div>
        </div>
      </div>

      {/* 텍스트 영역 */}
      <div className="flex flex-col gap-1 px-1">
        <h3 className="line-clamp-1 text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-primary-500 transition-colors">
          {title}
        </h3>
        <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
          {authorName}
        </p>
      </div>
    </div>
  );
}
