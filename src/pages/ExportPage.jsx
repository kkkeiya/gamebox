import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { exportGameData } from '../lib/exportJson'
import PageShell from '../components/layout/PageShell'

export default function ExportPage() {
  const navigate = useNavigate()
  const store = useGameStore()
  const data = exportGameData(store)
  const jsonString = JSON.stringify(data, null, 2)

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${store.gameTitle || 'gamebox'}-order.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    store.resetAll()
    navigate('/')
  }

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-extrabold text-navy">発注データ出力</h1>
      <p className="mt-1 text-navy/50 text-sm">以下のJSONデータを印刷業者に送付してください</p>

      <div className="mt-8 bg-navy rounded-2xl p-4 overflow-auto">
        <pre className="text-xs md:text-sm text-green-300 whitespace-pre font-mono leading-relaxed">
          {jsonString}
        </pre>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 rounded-xl bg-accent text-navy font-bold py-3.5 text-base hover:bg-accent/80 transition-colors cursor-pointer"
        >
          JSONをダウンロード
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 rounded-xl bg-white border border-navy/20 text-navy font-bold py-3.5 text-base hover:bg-navy/5 transition-colors cursor-pointer"
        >
          最初からやり直す
        </button>
      </div>
    </PageShell>
  )
}
