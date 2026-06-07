import StepBar from './StepBar'

export default function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-bg dot-pattern font-sans">
      <StepBar />
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {children}
      </main>
    </div>
  )
}
