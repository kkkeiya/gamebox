import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { generateCardPdf } from '../lib/generatePdf'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import CropModal from '../components/ui/CropModal'

const CARD_W = 189
const CARD_H = 264
const BLEED = 9

const BG_COLORS = ['#ffffff', '#EBF1FF', '#FFF9E0', '#E8F5E9', '#FDE8F0', '#F3E5F5']
const BORDER_COLORS = ['#0B1F5C', '#2C52C8', '#FFBC00', '#2E7D32', '#C62828', '#6A1B9A']
const BACK_COLORS = ['#0B1F5C', '#2C52C8', '#1B3A8C', '#C62828', '#2E7D32', '#6A1B9A', '#333333', '#FFBC00']
const EMOJI_PICKER = ['🐺','🦊','🧙‍♂️','👤','🔮','⚔️','🌙','🎭','💬','🤝','🎯','🃏','👑','🗡️','🛡️','🔑','💎','🌟','⭐','🎪']

const TITLE_SIZES = { S: 'text-[12px]', M: 'text-[14px]', L: 'text-[16px]' }
const BOTTOM_SIZES = { S: 'text-[10px]', M: 'text-[12px]', L: 'text-[13px]' }
const LAYOUTS = [
  { key: 'title-top', label: 'タイトル上' },
  { key: 'title-bottom', label: 'タイトル下' },
  { key: 'no-title', label: 'タイトルなし' },
]

const BACK_STYLES = [
  { key: 'simple', label: 'シンプル', desc: '単色ベタ塗り' },
  { key: 'pattern', label: 'パターン', desc: '幾何学模様' },
  { key: 'custom', label: 'カスタム', desc: '画像アップロード' },
]

export default function CardEditor() {
  const navigate = useNavigate()
  const { cards, cardSpec, updateCard, updateCardDesign, setCardSpec } = useGameStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [tab, setTab] = useState('style')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const [flipping, setFlipping] = useState(false)

  // Crop modal state
  const [cropSrc, setCropSrc] = useState(null)
  const [cropTarget, setCropTarget] = useState(null) // 'front' | 'back'
  const fileInputRef = useRef(null)
  const backFileInputRef = useRef(null)

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
  const fs = design.font_size || 'M'
  const titleSize = TITLE_SIZES[fs]
  const bottomSize = BOTTOM_SIZES[fs]
  const backDesign = cardSpec.back_design || { style: 'simple', color: '#0B1F5C' }

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      await generateCardPdf(cards, cardSpec.size, 'gamebox_cards_preview.pdf', backDesign)
    } catch (err) { console.error('PDF generation failed:', err) }
    finally { setPdfLoading(false) }
  }

  const handleFlip = () => {
    setFlipping(true)
    setTimeout(() => {
      setShowBack(!showBack)
      setTimeout(() => setFlipping(false), 300)
    }, 150)
  }

  const handleFileSelect = (e, target) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result)
      setCropTarget(target)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropApply = (dataUrl) => {
    if (cropTarget === 'front') {
      updateCardDesign(selectedIndex, { image_url: dataUrl })
    } else if (cropTarget === 'back') {
      setCardSpec({ back_design: { ...backDesign, style: 'custom', image_url: dataUrl } })
    }
    setCropSrc(null)
    setCropTarget(null)
  }

  const handleRemoveFrontImage = () => {
    updateCardDesign(selectedIndex, { image_url: '' })
  }

  const TABS = [
    { key: 'style', label: 'スタイル' },
    { key: 'text', label: 'テキスト' },
    { key: 'icon', label: 'アイコン' },
    { key: 'back', label: '背面' },
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
                {/* Image upload */}
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-2">カード画像をアップロード</label>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileSelect(e, 'front')} className="hidden" />
                  {design.image_url ? (
                    <div className="flex items-center gap-3">
                      <img src={design.image_url} alt="card" className="w-16 h-22 object-cover rounded-lg border-2 border-navy/15" style={{ aspectRatio: '63/88' }} />
                      <div className="flex flex-col gap-1.5">
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-bold text-navy bg-navy/10 px-3 py-1.5 rounded-full hover:bg-navy/20 cursor-pointer transition-colors">
                          変更
                        </button>
                        <button type="button" onClick={handleRemoveFrontImage}
                          className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 cursor-pointer transition-colors">
                          削除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-navy/20 rounded-xl py-6 text-sm font-bold text-navy/40 hover:border-navy/40 hover:text-navy/60 cursor-pointer transition-colors">
                      クリックして画像を選択（jpg/png/webp）
                    </button>
                  )}
                  <p className="text-[10px] text-navy/30 mt-1">アップロード後、トリミングできます</p>
                </div>

                <div className="border-t border-navy/10 pt-4">
                  <label className="block text-xs font-bold text-navy/60 mb-2">または絵文字を選択</label>
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

            {tab === 'back' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy/60 mb-2">背面スタイル</label>
                  <div className="space-y-2">
                    {BACK_STYLES.map((s) => (
                      <button key={s.key} type="button"
                        onClick={() => setCardSpec({ back_design: { ...backDesign, style: s.key } })}
                        className={`w-full text-left rounded-2xl px-4 py-3 transition-all cursor-pointer flex items-center justify-between ${
                          backDesign.style === s.key ? 'bg-navy text-white' : 'bg-white border-2 border-step-border text-navy hover:border-navy/30'
                        }`}>
                        <div>
                          <span className="font-bold text-sm">{s.label}</span>
                          <span className={`block text-xs mt-0.5 ${backDesign.style === s.key ? 'text-white/60' : 'text-navy/40'}`}>{s.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {backDesign.style !== 'custom' && (
                  <div>
                    <label className="block text-xs font-bold text-navy/60 mb-2">背面カラー</label>
                    <div className="flex gap-2 flex-wrap">
                      {BACK_COLORS.map((c) => (
                        <button key={c} type="button"
                          onClick={() => setCardSpec({ back_design: { ...backDesign, color: c } })}
                          className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${backDesign.color === c ? 'border-navy scale-110 ring-2 ring-offset-1 ring-navy' : 'border-transparent'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                )}

                {backDesign.style === 'custom' && (
                  <div>
                    <label className="block text-xs font-bold text-navy/60 mb-2">背面画像</label>
                    <input ref={backFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileSelect(e, 'back')} className="hidden" />
                    {backDesign.image_url ? (
                      <div className="flex items-center gap-3">
                        <img src={backDesign.image_url} alt="back" className="w-16 h-22 object-cover rounded-lg border-2 border-navy/15" style={{ aspectRatio: '63/88' }} />
                        <button type="button" onClick={() => backFileInputRef.current?.click()}
                          className="text-xs font-bold text-navy bg-navy/10 px-3 py-1.5 rounded-full hover:bg-navy/20 cursor-pointer transition-colors">
                          変更
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => backFileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-navy/20 rounded-xl py-6 text-sm font-bold text-navy/40 hover:border-navy/40 hover:text-navy/60 cursor-pointer transition-colors">
                        背面画像を選択
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black text-navy/40 uppercase tracking-widest">プレビュー</h2>
              <button type="button" onClick={handleFlip}
                className="text-[10px] font-bold text-navy/50 bg-navy/10 px-3 py-1 rounded-full hover:bg-navy/20 cursor-pointer transition-colors">
                {showBack ? '表面を見る' : '裏面を見る'} ↻
              </button>
            </div>
            <div className="flex justify-center" style={{ perspective: '800px' }}>
              <div className="relative">
                <div className="absolute border-2 border-dashed border-navy/15 rounded-[20px] pointer-events-none"
                  style={{ top: -BLEED, left: -BLEED, width: CARD_W + BLEED * 2, height: CARD_H + BLEED * 2 }} />
                <div className="absolute -top-6 right-0 text-[10px] text-navy/30 font-bold">塗り足し 3mm</div>

                <div
                  className="transition-transform duration-300"
                  style={{ transformStyle: 'preserve-3d', transform: flipping ? 'rotateY(90deg)' : 'rotateY(0deg)' }}
                >
                  {!showBack ? (
                    /* ─── Front ─── */
                    <div className="rounded-2xl shadow-lg flex flex-col items-center overflow-hidden"
                      style={{ width: CARD_W, height: CARD_H, background: design.bg_color || '#fff', border: `3px solid ${design.border_color || '#0B1F5C'}` }}>
                      {(design.layout || 'title-top') === 'title-top' && (
                        <div className="w-full px-2.5 pt-2 pb-1 shrink-0">
                          <p className={`${titleSize} font-black text-center leading-[1.3] line-clamp-2`} style={{ color: design.border_color || '#0B1F5C' }}>{design.title_text || current.name}</p>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col items-center justify-center gap-1 min-h-0">
                        {design.image_url ? (
                          <img src={design.image_url} alt="card" className="max-w-[80%] max-h-[80%] object-contain rounded-lg" />
                        ) : (
                          <span className="text-[48px] leading-none">{design.icon || '🃏'}</span>
                        )}
                        {design.center_text && <span className="text-[11px] font-bold leading-[1.3]" style={{ color: design.border_color || '#0B1F5C' }}>{design.center_text}</span>}
                      </div>
                      {(design.layout || 'title-top') === 'title-bottom' && (
                        <div className="w-full px-2.5 pt-1 pb-1 shrink-0">
                          <p className={`${titleSize} font-black text-center leading-[1.3] line-clamp-2`} style={{ color: design.border_color || '#0B1F5C' }}>{design.title_text || current.name}</p>
                        </div>
                      )}
                      <div className="w-full px-2.5 pt-1 pb-2 shrink-0">
                        <p className={`${bottomSize} text-navy/50 text-center leading-[1.3] line-clamp-3`}>{design.bottom_text || current.description || ''}</p>
                      </div>
                    </div>
                  ) : (
                    /* ─── Back ─── */
                    <div className="rounded-2xl shadow-lg overflow-hidden flex items-center justify-center"
                      style={{ width: CARD_W, height: CARD_H }}>
                      {backDesign.style === 'simple' && (
                        <div className="w-full h-full rounded-2xl flex items-center justify-center"
                          style={{ background: backDesign.color || '#0B1F5C', border: `3px solid ${backDesign.color || '#0B1F5C'}` }}>
                          <span className="text-white/20 text-[48px] font-black">GB</span>
                        </div>
                      )}
                      {backDesign.style === 'pattern' && (
                        <div className="w-full h-full rounded-2xl flex items-center justify-center relative"
                          style={{ background: backDesign.color || '#0B1F5C', border: `3px solid ${backDesign.color || '#0B1F5C'}` }}>
                          <div className="absolute inset-0 opacity-10"
                            style={{
                              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 9px),
                                repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 9px)`,
                            }} />
                          <div className="absolute inset-3 border-2 border-white/20 rounded-xl" />
                          <span className="text-white/30 text-[40px] font-black z-10">GB</span>
                        </div>
                      )}
                      {backDesign.style === 'custom' && backDesign.image_url && (
                        <img src={backDesign.image_url} alt="back" className="w-full h-full object-cover rounded-2xl" />
                      )}
                      {backDesign.style === 'custom' && !backDesign.image_url && (
                        <div className="w-full h-full rounded-2xl flex items-center justify-center bg-navy/10 border-2 border-dashed border-navy/20">
                          <span className="text-navy/30 text-sm font-bold">画像未設定</span>
                        </div>
                      )}
                    </div>
                  )}
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

      {/* Crop Modal */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onApply={handleCropApply}
          onCancel={() => { setCropSrc(null); setCropTarget(null) }}
        />
      )}
    </PageShell>
  )
}
