import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { generateCardPdf } from '../lib/generatePdf'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const CARD_W = 189 // 63mm * 3px
const CARD_H = 264 // 88mm * 3px
const BLEED = 9    // 3mm * 3px

export default function CardEditor() {
  const navigate = useNavigate()
  const { cards, cardSpec, updateCard } = useGameStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [pdfLoading, setPdfLoading] = useState(false)
  const cardRefs = useRef([])

  const setCardRef = useCallback((el, i) => {
    if (el) cardRefs.current[i] = el
  }, [])

  const current = cards[selectedIndex]

  if (!current) {
    return (
      <PageShell>
        <p className="text-navy/50">カードがありません。前のページで追加してください。</p>
      </PageShell>
    )
  }

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      // Render all card previews off-screen
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      document.body.appendChild(container)

      const elements = []
      for (const card of cards) {
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

      await generateCardPdf(elements, cardSpec.size)
      document.body.removeChild(container)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors'

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-black text-navy">カードデザイン</h1>
      <p className="mt-1 text-navy/50 text-sm">各カードの見た目を編集します</p>

      <div className="mt-8 flex flex-col md:flex-row gap-6">
        {/* Left: Card List */}
        <div className="md:w-48 shrink-0 space-y-1.5">
          <h2 className="text-xs font-black text-navy/50 mb-2 uppercase tracking-wider">カード一覧</h2>
          {cards.map((card, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`w-full text-left rounded-full px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                i === selectedIndex
                  ? 'bg-navy text-white'
                  : 'bg-white text-navy/70 hover:bg-navy/5 border-2 border-blue-200'
              }`}
            >
              {card.name}
              <span className="opacity-50 ml-1">×{card.count}</span>
            </button>
          ))}
        </div>

        {/* Right: Editor + Preview */}
        <div className="flex-1 space-y-6">
          {/* Preview Card */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Bleed guide */}
              <div
                className="absolute border-2 border-dashed border-navy/15 rounded-[20px] pointer-events-none"
                style={{
                  top: -BLEED,
                  left: -BLEED,
                  width: CARD_W + BLEED * 2,
                  height: CARD_H + BLEED * 2,
                }}
              />
              <div className="absolute -top-6 right-0 text-[10px] text-navy/30 font-bold">
                塗り足し 3mm
              </div>
              {/* Card */}
              <div
                ref={(el) => setCardRef(el, selectedIndex)}
                className="bg-white rounded-2xl border-2 border-navy shadow-lg flex flex-col items-center justify-between overflow-hidden"
                style={{ width: CARD_W, height: CARD_H }}
              >
                <div className="w-full bg-bg px-3 py-2.5">
                  <p className="text-xs font-black text-navy text-center truncate">
                    {current.name}
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-6xl">{current.emoji || '🃏'}</span>
                </div>
                <div className="w-full bg-bg px-3 py-2.5">
                  <p className="text-[10px] text-navy/50 text-center line-clamp-2">
                    {current.text || current.description || '説明テキスト'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Fields */}
          <Card className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">絵文字</label>
              <input
                type="text"
                value={current.emoji || ''}
                onChange={(e) => updateCard(selectedIndex, { emoji: e.target.value })}
                placeholder="🎭"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">テキスト</label>
              <textarea
                value={current.text || ''}
                onChange={(e) => updateCard(selectedIndex, { text: e.target.value })}
                placeholder="カードに表示するテキスト"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3">
        <Button onClick={() => navigate('/order')} className="flex-1">
          次へ →
        </Button>
        <Button
          variant="secondary"
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="flex-1"
        >
          {pdfLoading ? '生成中...' : 'PDFプレビューをダウンロード'}
        </Button>
      </div>
    </PageShell>
  )
}
