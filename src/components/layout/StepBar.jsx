import { useLocation, useNavigate } from 'react-router-dom'

const steps = [
  { path: '/', label: 'ジャンル' },
  { path: '/rules', label: 'ルール' },
  { path: '/cards', label: 'カード構成' },
  { path: '/cards/edit', label: 'デザイン' },
  { path: '/order', label: '見積もり' },
  { path: '/export', label: '出力' },
]

export default function StepBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const currentIndex = steps.findIndex((s) => s.path === pathname)

  return (
    <div className="w-full bg-white/80 backdrop-blur border-b border-navy/10 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-3xl mx-auto flex items-center gap-1 md:gap-2">
        {steps.map((step, i) => {
          const isActive = i === currentIndex
          const isDone = i < currentIndex
          return (
            <div key={step.path} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                onClick={() => isDone && navigate(step.path)}
                className={`flex items-center gap-1.5 text-xs md:text-sm font-semibold truncate transition-colors ${
                  isActive
                    ? 'text-navy'
                    : isDone
                      ? 'text-navy/50 cursor-pointer hover:text-navy/70'
                      : 'text-navy/25 cursor-default'
                }`}
              >
                <span
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-accent text-navy'
                      : isDone
                        ? 'bg-navy/20 text-navy/60'
                        : 'bg-navy/10 text-navy/30'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </span>
                <span className="hidden md:inline truncate">{step.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 md:mx-2 rounded ${
                    isDone ? 'bg-navy/20' : 'bg-navy/10'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
