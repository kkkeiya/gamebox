import { useState, useRef, useCallback, useEffect } from 'react'

const CARD_W = 252
const CARD_H = 352
const ASPECT = 63 / 88

export default function CropModal({ src, onApply, onCancel }) {
  const [scale, setScale] = useState(100)
  const [posX, setPosX] = useState(0)
  const [posY, setPosY] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgRef = useRef(null)
  const previewRef = useRef(null)

  const onImageLoad = useCallback(() => {
    setImgLoaded(true)
  }, [])

  // Preload image
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

    const img = imgRef.current
    const imgAspect = img.naturalWidth / img.naturalHeight
    const cardAspect = CARD_W / CARD_H

    // Base: fill the card area
    let drawW, drawH
    if (imgAspect > cardAspect) {
      drawH = CARD_H
      drawW = CARD_H * imgAspect
    } else {
      drawW = CARD_W
      drawH = CARD_W / imgAspect
    }

    // Apply scale
    const s = scale / 100
    drawW *= s
    drawH *= s

    // Center + offset
    const dx = (CARD_W - drawW) / 2 + (posX / 100) * CARD_W
    const dy = (CARD_H - drawH) / 2 + (posY / 100) * CARD_H

    ctx.drawImage(img, dx, dy, drawW, drawH)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    onApply(dataUrl)
  }

  // Compute preview transform
  const getPreviewStyle = () => {
    if (!imgRef.current) return {}
    const img = imgRef.current
    const imgAspect = img.naturalWidth / img.naturalHeight
    const cardAspect = ASPECT

    let baseW, baseH
    // Preview container is 252x352 scaled down to fit
    const containerW = 200
    const containerH = containerW / ASPECT

    if (imgAspect > cardAspect) {
      baseH = containerH
      baseW = containerH * imgAspect
    } else {
      baseW = containerW
      baseH = containerW / imgAspect
    }

    const s = scale / 100
    const w = baseW * s
    const h = baseH * s
    const tx = (containerW - w) / 2 + (posX / 100) * containerW
    const ty = (containerH - h) / 2 + (posY / 100) * containerH

    return {
      width: w,
      height: h,
      transform: `translate(${tx}px, ${ty}px)`,
      position: 'absolute',
      top: 0,
      left: 0,
    }
  }

  const previewContainerW = 200
  const previewContainerH = previewContainerW / ASPECT

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-black text-navy mb-3">画像を調整</h3>

        {/* Preview area */}
        <div className="flex justify-center mb-4">
          <div
            className="relative rounded-xl overflow-hidden border-2 border-navy/15"
            style={{ width: previewContainerW, height: previewContainerH }}
          >
            {imgLoaded && imgRef.current && (
              <img
                src={src}
                alt="preview"
                style={getPreviewStyle()}
                draggable={false}
              />
            )}
            {!imgLoaded && (
              <div className="w-full h-full flex items-center justify-center bg-navy/5">
                <span className="text-navy/30 text-sm">読み込み中...</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Scale */}
          <div>
            <label className="block text-sm font-bold text-navy mb-1.5">画像の大きさ</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-navy/40 shrink-0">🔍−</span>
              <input
                type="range"
                min={50}
                max={200}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="flex-1 h-1"
                style={{ accentColor: '#0B1F5C' }}
              />
              <span className="text-xs text-navy/40 shrink-0">🔍+</span>
              <span className="text-xs font-bold text-navy w-10 text-right">{scale}%</span>
            </div>
          </div>

          {/* Position X */}
          <div>
            <label className="block text-sm font-bold text-navy mb-1.5">左右の位置</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-navy/40 shrink-0">←</span>
              <input
                type="range"
                min={-50}
                max={50}
                value={posX}
                onChange={(e) => setPosX(Number(e.target.value))}
                className="flex-1 h-1"
                style={{ accentColor: '#0B1F5C' }}
              />
              <span className="text-xs text-navy/40 shrink-0">→</span>
              <span className="text-xs font-bold text-navy w-10 text-right">{posX > 0 ? '+' : ''}{posX}</span>
            </div>
          </div>

          {/* Position Y */}
          <div>
            <label className="block text-sm font-bold text-navy mb-1.5">上下の位置</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-navy/40 shrink-0">↑</span>
              <input
                type="range"
                min={-50}
                max={50}
                value={posY}
                onChange={(e) => setPosY(Number(e.target.value))}
                className="flex-1 h-1"
                style={{ accentColor: '#0B1F5C' }}
              />
              <span className="text-xs text-navy/40 shrink-0">↓</span>
              <span className="text-xs font-bold text-navy w-10 text-right">{posY > 0 ? '+' : ''}{posY}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
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
