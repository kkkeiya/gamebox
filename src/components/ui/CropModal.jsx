import { useState, useRef, useEffect } from 'react'

const CARD_W = 252
const CARD_H = 352

export default function CropModal({ src, onApply, onCancel }) {
  const [imageScale, setImageScale] = useState(100)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImgLoaded(true)
    }
    img.src = src
  }, [src])

  const handleApply = () => {
    if (!imgRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = CARD_W
    canvas.height = CARD_H
    const ctx = canvas.getContext('2d')

    // White background to prevent black edges
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CARD_W, CARD_H)

    const img = imgRef.current
    const scale = imageScale / 100
    const drawW = img.naturalWidth * scale
    const drawH = img.naturalHeight * scale
    const x = (CARD_W - drawW) / 2 + (offsetX / 100) * CARD_W
    const y = (CARD_H - drawH) / 2 + (offsetY / 100) * CARD_H

    ctx.drawImage(img, x, y, drawW, drawH)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    onApply(dataUrl)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-black text-navy mb-3">画像を調整</h3>

        {/* Preview area */}
        <div className="flex justify-center mb-4">
          <div
            className="relative rounded-xl overflow-hidden border-2 border-navy/15"
            style={{ width: 200, aspectRatio: '63/88', background: '#ffffff' }}
          >
            {imgLoaded && (
              <img
                src={src}
                alt="preview"
                draggable={false}
                className="absolute w-full h-full"
                style={{
                  objectFit: 'contain',
                  transform: `scale(${imageScale / 100}) translate(${offsetX}%, ${offsetY}%)`,
                  transformOrigin: 'center center',
                }}
              />
            )}
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-navy/5">
                <span className="text-navy/30 text-sm">読み込み中...</span>
              </div>
            )}
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
          <button type="button" onClick={handleApply} disabled={!imgLoaded}
            className="flex-1 rounded-full bg-navy text-white font-bold py-2.5 text-sm hover:bg-navy/90 transition-colors cursor-pointer disabled:opacity-40">
            適用する
          </button>
        </div>
      </div>
    </div>
  )
}
