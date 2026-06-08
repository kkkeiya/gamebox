import Header from './Header'
import StepBar from './StepBar'
import { useAutoSave } from '../../hooks/useAutoSave'

export default function PageShell({ children }) {
  const saved = useAutoSave()

  return (
    <div className="min-h-screen bg-bg dot-pattern-hero font-sans">
      <div className="sticky top-0 z-50">
        <Header />
        <StepBar />
      </div>
      <main className="max-w-3xl mx-auto px-5 py-8 md:py-12">
        {children}
      </main>
      {saved && (
        <div className="fixed bottom-5 right-5 bg-navy text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-fade-in z-50">
          保存しました ✓
        </div>
      )}
    </div>
  )
}
