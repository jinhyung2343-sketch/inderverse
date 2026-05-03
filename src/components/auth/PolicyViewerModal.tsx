'use client'

export interface ViewablePolicyDocument {
  id: string
  title: string
  version: string
  summary: string
  sections: Array<{
    id: string
    title: string
    paragraphs?: string[]
    items?: string[]
  }>
}

export function PolicyViewerModal({
  document,
  onClose,
}: {
  document: ViewablePolicyDocument | null
  onClose: () => void
}) {
  if (!document) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0b0b] text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Policy Viewer</p>
            <h2 className="text-2xl font-bold tracking-tight">{document.title}</h2>
            <p className="text-sm leading-6 text-zinc-400">{document.summary}</p>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-[0.2em] text-zinc-400">
              버전 {document.version}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10"
            aria-label="약관 보기 닫기"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid gap-6">
            {document.sections.map((section) => (
              <section key={section.id} className="grid gap-3">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-zinc-300">
                    {paragraph}
                  </p>
                ))}
                {section.items?.length ? (
                  <ol className="grid gap-2">
                    {section.items.map((item, index) => (
                      <li key={`${section.id}-${index}`} className="text-sm leading-7 text-zinc-300">
                        {index + 1}. {item}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
