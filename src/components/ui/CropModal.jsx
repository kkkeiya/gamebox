import { useState } from 'react'

export default function CropModal({ src, onApply, onCancel }) {
  const [imageScale, setImageScale] = useState(100)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)

  const handleApply = () => {
    const CARD_W = 252
    const CARD_H = 352
    const canvas = document.createElement('canvas')
    canvas.width = CARD_W
    canvas.height = CARD_H
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CARD_W, CARD_H)

    const img = new Image()
    img.onload = () => {
      const scale = imageScale / 100
      const baseScaleW = CARD_W / img.naturalWidth
      const baseScaleH = CARD_H / img.naturalHeight
      const baseScale = Math.max(baseScaleW, baseScaleH)

      const finalScale = baseScale * scale
      const drawW = img.naturalWidth * finalScale
      const drawH = img.naturalHeight * finalScale

      const x = (CARD_W - drawW) / 2 + (offsetX / 100) * CARD_W
      const y = (CARD_H - drawH) / 2 + (offsetY / 100) * CARD_H

      ctx.drawImage(img, x, y, drawW, drawH)
      onApply(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.src = src
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-black text-navy mb-3">画像を調整</h3>

        {/* Preview */}
        <div className="flex justify-center mb-4">
          <div
            className="relative overflow-hidden rounded-lg"
            style={{ width: '100%', maxWidth: 220, aspectRatio: '63/88', background: '#ffffff', border: '2px solid #e2e8f0' }}
          >
            <img
              src={src}
              alt="preview"
              draggable={false}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${offsetX}%), calc(-50% + ${offsetY}%)) scale(${imageScale / 100})`,
                transformOrigin: 'center center',
                maxWidth: 'none',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-navy mb-1.5">画像の大きさ</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-navy/40 shrink-0">🔍−</span>
              <input type="range" min={50} max={200} value={imageScale}
                onChange={(e) => setImageScale(Number(e.target.value))}
                className="flex-1 h-1" style={{ accentColor: '#0B1F5C' }} />
              <span className="text-xs text-navy/40 shrink-0">🔍+</span>
              <span className="text-xs font-bold text-navy w-10 text-right">{imageScale}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-navy mb-1.5">左右の位置</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-navy/40 shrink-0">←</span>
              <input type="range" min={-50} max={50} value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="flex-1 h-1" style={{ accentColor: '#0B1F5C' }} />
              <span className="text-xs text-navy/40 shrink-0">→</span>
              <span className="text-xs font-bold text-navy w-10 text-right">{offsetX > 0 ? '+' : ''}{offsetX}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-navy mb-1.5">上下の位置</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-navy/40 shrink-0">↑</span>
              <input type="range" min={-50} max={50} value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="flex-1 h-1" style={{ accentColor: '#0B1F5C' }} />
              <span className="text-xs text-navy/40 shrink-0">↓</span>
              <span className="text-xs font-bold text-navy w-10 text-right">{offsetY > 0 ? '+' : ''}{offsetY}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-full border-2 border-navy/15 text-navy font-bold py-2.5 text-sm hover:bg-navy/5 transition-colors cursor-pointer">
            キャンセル
          </button>
          <button type="button" onClick={handleApply}
            className="flex-1 rounded-full bg-navy text-white font-bold py-2.5 text-sm hover:bg-navy/90 transition-colors cursor-pointer">
            適用する
          </button>
        </div>
      </div>
    </div>
  )
}
