export default function Stepper({ steps, activeStep }) {
  return (
    <div className="rounded-card border border-brand-100 bg-white/80 px-4 py-4 shadow-soft backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const current = index + 1 === activeStep
          const done = index + 1 < activeStep
          return (
            <div key={step} className="flex min-w-0 flex-1 items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${done ? 'bg-stone-900 text-white' : current ? 'bg-brand-500 text-white' : 'bg-stone-200 text-stone-500'}`}>
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-semibold ${current || done ? 'text-stone-900' : 'text-stone-500'}`}>{step}</p>
                {index < steps.length - 1 ? <div className="mt-2 h-1 rounded-full bg-stone-200"><div className={`h-1 rounded-full ${done ? 'bg-stone-900' : 'bg-transparent'}`} /></div> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
