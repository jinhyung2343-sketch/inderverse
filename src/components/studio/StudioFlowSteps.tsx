interface StudioFlowStep {
  label: string
  description: string
}

export function StudioFlowSteps({
  currentStep,
  steps,
}: {
  currentStep: number
  steps: StudioFlowStep[]
}) {
  return (
    <nav
      aria-label="작품 업로드 단계"
      className="grid gap-2 rounded-[24px] border border-white/10 bg-white/5 p-3 text-sm backdrop-blur-xl md:grid-cols-3"
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCurrent = stepNumber === currentStep
        const isComplete = stepNumber < currentStep

        return (
          <div
            key={step.label}
            className={`rounded-2xl border px-4 py-3 ${
              isCurrent
                ? 'border-emerald-300/40 bg-emerald-500/10 text-white'
                : isComplete
                  ? 'border-white/10 bg-white/10 text-zinc-200'
                  : 'border-white/10 bg-black/20 text-zinc-500'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em]">Step {stepNumber}</p>
            <p className="mt-2 font-semibold">{step.label}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{step.description}</p>
          </div>
        )
      })}
    </nav>
  )
}
