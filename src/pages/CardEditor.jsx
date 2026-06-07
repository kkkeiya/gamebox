import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { generateCardPdf } from '../lib/generatePdf'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const CARD_W = 189
const CARD_H = 264
const BLEED = 9

const BG_COLORS = ['#ffffff', '#EBF1FF', '#FFF9E0', '#E8F5E9', '#FDE8F0', '#F3E5F5']
const BORDER_COLORS = ['#0B1F5C', '#2C52C8', '#FFBC00', '#2E7D32', '#C62828', '#6A1B9A']
const EMOJI_PICKER = ['🐺','🦊','🧙‍♂️','👤','🔮','⚔️','🌙','🎭','💬','🤝','🎯','🃏','👑','🗡️','🛡️','🔑','💎','🌟','⭐','🎪']

const FONT_SIZES = { S: { icon: 'text-4xl', center: 'text-xs' }, M: { icon: 'text-6xl', center: 'text-sm' }, L: { icon: 'text-7xl', center: 'text-base' } }
const LAYOUTS = [
  { key: 'title-top', label: 'タイトル上' },
  { key: 'title-bottom', label: 'タイトル下' },
  { key: 'no-title', label: 'タイトルなし' },
]

export default function CardEditor() {
  const navigate = useNavigate()
  const { cards, cardSpec, updateCard, updateCardDesign } = useGameStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [tab, setTab] = useState('style')
  const [pdfLoading, setPdfLoading] = useState(false)

  const current = cards[selectedIndex]

  if (!current) {
    return (
      <PageShell>
        <div className="text-center py-20">
          <p className="text-navy/50 text-lg">カードがありません</p>
          <Button onClick={() => navigate('/cards')} className="mt-4">カード構成に戻る</Button>
        </div>
      </PageShell>
    )
  }

  const design = current.design || {}
  const fontSize = FONT_SIZES[design.font_size || 'M']

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      const container = document.createElement('div')
      container.style.cssText = 'position:absolute;left:-9999px;top:0'
      document.body.appendChild(container)
      const elements = []
      for (const card of cards) {
        const d = card.design || {}
        const el = document.createElement('div')
        el.style.cssText = `width:${CARD_W}px;height:${CARD_H}px;background:${d.bg_color || '#fff'};display:flex;flex-direction:column;align-items:center;justify-content:space-between;font-family:Nunito,sans-serif;overflow:hidden;border-radius:12px;border:3px solid ${d.border_color || '#0B1F5C'}`
        const layout = d.layout || 'title-top'
        const titleHtml = layout !== 'no-title' ? `<div style="width:100%;padding:8px 12px;text-align:center"><div style="font-size:12px;font-weight:900;color:${d.border_color || '#0B1F5C'};overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${d.title_text || card.name}</div></div>` : ''
        const bottomHtml = `<div style="width:100%;padding:8px 12px;text-align:center"><div style="font-size:10px;color:rgba(11,31,92,0.5);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${d.bottom_text || card.description || ''}</div></div>`
        el.innerHTML = `${layout === 'title-top' ? titleHtml : ''}<div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px"><span style="font-size:48px">${d.icon || '🃏'}</span>${d.center_text ? `<span style="font-size:11px;font-weight:700;color:${d.border_color || '#0B1F5C'}">${d.center_text}</span>` : ''}</div>${layout === 'title-bottom' ? titleHtml : ''}${bottomHtml}`
        container.appendChild(el)
        elements.push(el)
      }
      await generateCardPdf(elements, cardSpec.size)
      document.body.removeChild(container)
    } catch (err) { console.error('PDF generation failed:', err) }
    finally { setPdfLoading(false) }
  }

  const TABS = [
    { key: 'style', label: 'スタイル' },
    { key: 'text', label: 'テキスト' },
    { key: 'icon', label: 'アイコン' },
  ]

  const inputClass = 'w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors'

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-black text-navy">カードデザイン</h1>
      <p className="mt-1 text-navy/50 text-sm">各カードの見た目を編集します</p>

      <div className="mt-8 flex flex-col md:flex-row gap-6">
        {/* ─── Left: Card List ─── */}
        <div className="md:w-44 shrink-0 space-y-1.5">
          <h2 className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-2">カード一覧</h2>
          {cards.map((card, i) => (
            <button key={card.id || i} type="button" onClick={() => setSelectedIndex(i)}
              className={`w-full text-left rounded-2xl px-3 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                i === selectedIndex ? 'border-[2.5px] border-navy bg-bg-alt text-navy' : 'border-[2.5px] border-step-border bg-white text-navy/60 hover:border-navy/30'
              }`}>
              <span className="mr-1">{card.design?.icon || card.emoji}</span>
              {card.name}
              <span className="opacity-40 ml-1 text-xs">×{card.count}</span>
            </button>
          ))}
        </div>

        {/* ─── Right: Editor + Preview ─── */}
        <div className="flex-1 space-y-6">
          {/* Tab bar */}
          <div className="flex gap-1 bg-navy/5 rounded-full p-1">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`flex-1 rounded-full py-2 text-xs font-bold transition-all cursor-pointer ${tab === t.key ? 'bg-navy text-white' : 'text-navy/50 hover:text-navy'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <Card className="p-5">
            {tab === 'style' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-2">背景色</label>
                  <div className="flex gap-2">
                    {BG_COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => updateCardDesign(selectedIndex, { bg_color: c })}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${design.bg_color === c ? 'border-navy scale-110' : 'border-navy/15'}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-2">枠線の色</label>
                  <div className="flex gap-2">
                    {BORDER_COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => updateCardDesign(selectedIndex, { border_color: c })}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${design.border_color === c ? 'border-navy scale-110 ring-2 ring-offset-1 ring-navy' : 'border-transparent'}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-2">レイアウト</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LAYOUTS.map((l) => (
                      <button key={l.key} type="button" onClick={() => updateCardDesign(selectedIndex, { layout: l.key })}
                        className={`rounded-full py-2 text-xs font-bold transition-all cursor-pointer ${design.layout === l.key || (!design.layout && l.key === 'title-top') ? 'bg-navy text-white' : 'bg-white border-2 border-step-border text-navy/60'}`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-1">カード上部テキスト</label>
                  <input type="text" value={design.title_text || ''} onChange={(e) => updateCardDesign(selectedIndex, { title_text: e.target.value })} placeholder={current.name} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-1">中央テキスト</label>
                  <input type="text" value={design.center_text || ''} onChange={(e) => updateCardDesign(selectedIndex, { center_text: e.target.value })} placeholder="大きく表示するテキスト" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-1">下部テキスト</label>
                  <textarea value={design.bottom_text || ''} onChange={(e) => updateCardDesign(selectedIndex, { bottom_text: e.target.value })} placeholder="説明テキスト" rows={2} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-2">フォントサイズ</label>
                  <div className="flex gap-2">
                    {['S', 'M', 'L'].map((s) => (
                      <button key={s} type="button" onClick={() => updateCardDesign(selectedIndex, { font_size: s })}
                        className={`flex-1 rounded-full py-2 text-sm font-bold cursor-pointer transition-all ${(design.font_size || 'M') === s ? 'bg-navy text-white' : 'bg-white border-2 border-step-border text-navy/60'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'icon' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-2">絵文字を選択</label>
                  <div className="grid grid-cols-10 gap-1.5">
                    {EMOJI_PICKER.map((e) => (
                      <button key={e} type="button" onClick={() => updateCardDesign(selectedIndex, { icon: e })}
                        className={`text-2xl p-1 rounded-lg cursor-pointer transition-all hover:scale-110 ${design.icon === e ? 'bg-navy/10 scale-110' : ''}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-1">または直接入力</label>
                  <input type="text" value={design.icon || ''} onChange={(e) => updateCardDesign(selectedIndex, { icon: e.target.value })} placeholder="🎭" className={inputClass} />
                </div>
              </div>
            )}
          </Card>

          {/* Preview */}
          <div>
            <h2 className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-3">プレビュー</h2>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute border-2 border-dashed border-navy/15 rounded-[20px] pointer-events-none"
                  style={{ top: -BLEED, left: -BLEED, width: CARD_W + BLEED * 2, height: CARD_H + BLEED * 2 }} />
                <div className="absolute -top-6 right-0 text-[10px] text-navy/30 font-bold">塗り足し 3mm</div>
                <div className="rounded-2xl shadow-lg flex flex-col items-center justify-between overflow-hidden"
                  style={{ width: CARD_W, height: CARD_H, background: design.bg_color || '#fff', border: `3px solid ${design.border_color || '#0B1F5C'}` }}>
                  {(design.layout || 'title-top') === 'title-top' && (
                    <div className="w-full px-3 py-2.5" style={{ background: 'rgba(240,244,255,0.5)' }}>
                      <p className="text-xs font-black text-center truncate" style={{ color: design.border_color || '#0B1F5C' }}>{design.title_text || current.name}</p>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col items-center justify-center gap-1">
                    <span className={fontSize.icon}>{design.icon || '🃏'}</span>
                    {design.center_text && <span className={`${fontSize.center} font-bold`} style={{ color: design.border_color || '#0B1F5C' }}>{design.center_text}</span>}
                  </div>
                  {(design.layout || 'title-top') === 'title-bottom' && (
                    <div className="w-full px-3 py-2" style={{ background: 'rgba(240,244,255,0.5)' }}>
                      <p className="text-xs font-black text-center truncate" style={{ color: design.border_color || '#0B1F5C' }}>{design.title_text || current.name}</p>
                    </div>
                  )}
                  <div className="w-full px-3 py-2" style={{ background: 'rgba(240,244,255,0.5)' }}>
                    <p className="text-[10px] text-navy/50 text-center line-clamp-2">{design.bottom_text || current.description || ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3">
        <Button onClick={() => navigate('/order')} className="flex-1">次へ →</Button>
        <Button variant="secondary" onClick={handleDownloadPdf} disabled={pdfLoading} className="flex-1">
          {pdfLoading ? '生成中...' : 'PDFプレビュー'}
        </Button>
      </div>
    </PageShell>
  )
}
