import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { exportGameData } from '../lib/exportJson'
import { generateCardPdf } from '../lib/generatePdf'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const CARD_W = 189
const CARD_H = 264

export default function ExportPage() {
  const navigate = useNavigate()
  const store = useGameStore()
  const data = exportGameData(store)
  const jsonString = JSON.stringify(data, null, 2)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${store.gameTitle || 'gamebox'}-order.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      document.body.appendChild(container)

      const elements = []
      for (const card of store.cards) {
        const el = document.createElement('div')
        el.style.width = `${CARD_W}px`
        el.style.height = `${CARD_H}px`
        el.style.backgroundColor = '#ffffff'
        el.style.display = 'flex'
        el.style.flexDirection = 'column'
        el.style.alignItems = 'center'
        el.style.justifyContent = 'space-between'
        el.style.fontFamily = 'Nunito, sans-serif'
        el.style.overflow = 'hidden'
        el.style.borderRadius = '12px'
        el.style.border = '2px solid #0B1F5C'

        el.innerHTML = `
          <div style="width:100%;background:#f0f4ff;padding:8px 12px;text-align:center">
            <div style="font-size:12px;font-weight:900;color:#0B1F5C;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${card.name}</div>
          </div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center">
            <span style="font-size:48px">${card.emoji || '🃏'}</span>
          </div>
          <div style="width:100%;background:#f0f4ff;padding:8px 12px;text-align:center">
            <div style="font-size:10px;color:#0B1F5C99;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${card.text || card.description || ''}</div>
          </div>
        `
        container.appendChild(el)
        elements.push(el)
      }

      await generateCardPdf(elements, store.cardSpec.size)
      document.body.removeChild(container)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleReset = () => {
    store.resetAll()
    navigate('/')
  }

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-black text-navy">発注データ出力</h1>
      <p className="mt-1 text-navy/50 text-sm">以下のJSONデータを印刷業者に送付してください</p>

      <div className="mt-8 bg-navy rounded-2xl p-5 overflow-auto">
        <pre className="text-xs md:text-sm text-green-300 whitespace-pre font-mono leading-relaxed">
          {jsonString}
        </pre>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button onClick={handleDownloadJson} className="flex-1">
          JSONをダウンロード
        </Button>
        <Button
          variant="secondary"
          onClick={handleDownloadPdf}
          disabled={pdfLoading || store.cards.length === 0}
          className="flex-1"
        >
          {pdfLoading ? '生成中...' : 'カードPDFをダウンロード'}
        </Button>
      </div>

      <button
        type="button"
        onClick={handleReset}
        className="mt-4 w-full rounded-full border-2 border-navy/15 text-navy font-bold py-3.5 text-base hover:bg-navy/5 transition-colors cursor-pointer"
      >
        最初からやり直す
      </button>
    </PageShell>
  )
}
