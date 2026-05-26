'use client'

import { useState } from 'react'

export function FreeArchiveConfirmField({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked)
  const [showConfirm, setShowConfirm] = useState(false)

  function handleChange(nextChecked: boolean) {
    setChecked(nextChecked)

    if (nextChecked) {
      setShowConfirm(true)
    }
  }

  function cancelFreeArchive() {
    setChecked(false)
    setShowConfirm(false)
  }

  function confirmFreeArchive() {
    setShowConfirm(false)
  }

  return (
    <>
      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
        <input
          type="checkbox"
          name="isFreeArchive"
          checked={checked}
          onChange={(event) => handleChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
        />
        <span>이 작품 전체를 무료 아카이브로 공개합니다.</span>
      </label>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] border border-amber-300/20 bg-[#0b0b0b] p-6 text-white shadow-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Free Archive</p>
            <h3 className="mt-3 text-2xl font-bold">전체 무료 공개로 전환할까요?</h3>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300">
              <p>
                전체 무료 공개를 선택하면 이 작품의 공개 회차는 맛보기 비율이나 구독 공개 규칙 없이 누구나
                열람할 수 있습니다.
              </p>
              <p>
                이 설정이 켜져 있는 동안에는 이 작품의 회차 열람 수익이 발생하지 않습니다. 저장 후에도 다시
                해제할 수 있습니다.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={cancelFreeArchive}
                className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmFreeArchive}
                className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                전체 무료 공개 선택
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
