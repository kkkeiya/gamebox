import { useState, useRef, useCallback } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const ASPECT = 63 / 88

function getCroppedCanvas(image, crop) {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  canvas.width = crop.width * scaleX
  canvas.height = crop.height * scaleY
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  return canvas
}

export default function CropModal({ src, onApply, onCancel }) {
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const [zoom, setZoom] = useState(100)
  const imgRef = useRef(null)

  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget
    const { width, height } = e.currentTarget
    const cropW = Math.min(width * 0.8, height * 0.8 * ASPECT)
    const cropH = cropW / ASPECT
    setCrop({
      unit: 'px',
      x: (width - cropW) / 2,
      y: (height - cropH) / 2,
      width: cropW,
      height: cropH,
    })
  }, [])

  const handleApply = () => {
    if (!completedCrop || !imgRef.current) return
    const canvas = getCroppedCanvas(imgRef.current, completedCrop)
    const dataUrl = canvas.toDataURL('image/png')
    onApply(dataUrl)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-black text-navy mb-3">画像をトリミング</h3>

        <div className="flex justify-center bg-navy/5 rounded-xl p-2 overflow-hidden max-h-[60vh]">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={ASPECT}
          >
            <img
              src={src}
              onLoad={onImageLoad}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center', maxHeight: '55vh' }}
              alt="crop source"
            />
          </ReactCrop>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs font-bold text-navy/50 shrink-0">ズーム</span>
          <input
            type="range"
            min={50}
            max={200}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-navy"
          />
          <span className="text-xs font-bold text-navy w-10 text-right">{zoom}%</span>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-full border-2 border-navy/15 text-navy font-bold py-2.5 text-sm hover:bg-navy/5 transition-colors cursor-pointer">
            キャンセル
          </button>
          <button type="button" onClick={handleApply}
            className="flex-1 rounded-full bg-navy text-white font-bold py-2.5 text-sm hover:bg-navy/90 transition-colors cursor-pointer">
            適用
          </button>
        </div>
      </div>
    </div>
  )
}
