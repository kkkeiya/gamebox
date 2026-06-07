import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { exportGameData } from '../lib/exportJson'
import { generateCardPdf } from '../lib/generatePdf'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'

const CARD_W = 189
const CARD_H = 264

export default function ExportPage() {
  const navigate = useNavigate()
  const store = useGameStore()
  const data = exportGameData(store)
  const jsonString = JSON.stringify(data, null, 2)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  const cardTypes = useMemo(() => ['all', ...new Set(store.cards.map((c) => c.name))], [store.cards])
  const filteredCards = filter === 'all' ? store.cards : store.cards.filter((c) => c.name === filter)

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
      container.style.cssText = 'position:absolute;left:-9999px;top:0'
      document.body.appendChild(container)
      const elements = []
      for (const card of store.cards) {
        const d = card.design || {}
        const el = document.createElement('div')
        el.style.cssText = `width:${CARD_W}px;height:${CARD_H}px;background:${d.bg_color || '#fff'};display:flex;flex-direction:column;align-items:center;justify-content:space-between;font-family:Nunito,sans-serif;overflow:hidden;border-radius:12px;border:3px solid ${d.border_color || '#0B1F5C'}`
        const layout = d.layout || 'title-top'
        const titleHtml = layout !== 'no-title' ? `<div style="width:100%;padding:8px 12px;text-align:center"><div style="font-size:12px;font-weight:900;color:${d.border_color || '#0B1F5C'}">${d.title_text || card.name}</div></div>` : ''
        const bottomHtml = `<div style="width:100%;padding:8px 12px;text-align:center"><div style="font-size:10px;color:rgba(11,31,92,0.5)">${d.bottom_text || card.description || ''}</div></div>`
        el.innerHTML = `${layout === 'title-top' ? titleHtml : ''}<div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px"><span style="font-size:48px">${d.icon || '🃏'}</span>${d.center_text ? `<span style="font-size:11px;font-weight:700;color:${d.border_color || '#0B1F5C'}">${d.center_text}</span>` : ''}</div>${layout === 'title-bottom' ? titleHtml : ''}${bottomHtml}`
        container.appendChild(el)
        elements.push(el)
      }
      await generateCardPdf(elements, store.cardSpec.size)
      document.body.removeChild(container)
    } catch (err) { console.error('PDF generation failed:', err) }
    finally { setPdfLoading(false) }
  }

  const handleReset = () => { store.resetAll(); navigate('/') }

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-black text-navy">発注データ出力</h1>
      <p className="mt-1 text-navy/50 text-sm">カード一覧を確認して、データをダウンロードしてください</p>

      {/* ─── Card Grid ─── */}
      {store.cards.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-black text-navy/40 uppercase tracking-widest">カード一覧</h2>
            <div className="flex gap-1">
              {cardTypes.map((t) => (
                <button key={t} type="button" onClick={() => setFilter(t)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${filter === t ? 'bg-navy text-white' : 'bg-navy/10 text-navy/50 hover:bg-navy/20'}`}>
                  {t === 'all' ? 'すべて' : t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filteredCards.map((card, i) => {
              const d = card.design || {}
              return (
                <div key={card.id || i} className="rounded-xl overflow-hidden flex flex-col items-center justify-between shadow-sm"
                  style={{ aspectRatio: '63/88', background: d.bg_color || '#fff', border: `2px solid ${d.border_color || '#0B1F5C'}` }}>
                  <div className="w-full text-center py-1 px-1" style={{ background: 'rgba(240,244,255,0.5)' }}>
                    <p className="text-[8px] font-black truncate" style={{ color: d.border_color || '#0B1F5C' }}>{d.title_text || card.name}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">{d.icon || card.emoji || '🃏'}</span>
                  </div>
                  <div className="w-full text-center py-1 px-1" style={{ background: 'rgba(240,244,255,0.5)' }}>
                    <p className="text-[7px] text-navy/40 truncate">{d.bottom_text || card.description || ''}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── JSON ─── */}
      <div className="mt-8 bg-navy rounded-2xl p-4 overflow-auto max-h-64">
        <pre className="text-xs text-green-300 whitespace-pre font-mono leading-relaxed">{jsonString}</pre>
      </div>

      {/* ─── Actions ─── */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button onClick={handleDownloadJson} className="flex-1">発注JSONをダウンロード</Button>
        <Button variant="secondary" onClick={handleDownloadPdf} disabled={pdfLoading || store.cards.length === 0} className="flex-1">
          {pdfLoading ? '生成中...' : 'カードPDFをダウンロード'}
        </Button>
      </div>

      <button type="button" onClick={handleReset}
        className="mt-4 w-full rounded-full border-2 border-navy/15 text-navy font-bold py-3.5 text-base hover:bg-navy/5 transition-colors cursor-pointer">
        最初からやり直す
      </button>
    </PageShell>
  )
}
