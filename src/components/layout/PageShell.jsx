import Header from './Header'
import StepBar from './StepBar'

export default function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-bg dot-pattern-hero font-sans">
      <div className="sticky top-0 z-50">
        <Header />
        <StepBar />
      </div>
      <main className="max-w-3xl mx-auto px-5 py-8 md:py-12">
        {children}
      </main>
    </div>
  )
}
