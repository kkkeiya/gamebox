import { jsPDF } from 'jspdf'

const SIZE_MM = {
  poker: { w: 63, h: 88 },
  bridge: { w: 58, h: 89 },
  mini: { w: 44, h: 63 },
}

// 1mm ≈ 3.78px at 96dpi
const MM_TO_PX = 3.78

/**
 * Render text to a canvas image (supports Japanese via browser fonts).
 * Returns { dataUrl, widthMm, heightMm } or null on failure.
 */
function textToImage(text, options = {}) {
  const {
    fontSize = 14,
    fontWeight = 'bold',
    color = '#0B1F5C',
    maxWidthMm = 55,
  } = options

  try {
    const maxWidthPx = maxWidthMm * MM_TO_PX
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const font = `${fontWeight} ${fontSize}px "Nunito", "Hiragino Sans", "Yu Gothic", sans-serif`
    ctx.font = font

    // Word-wrap by character
    const lines = []
    let currentLine = ''
    for (const char of text) {
      const testLine = currentLine + char
      if (ctx.measureText(testLine).width > maxWidthPx && currentLine) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)

    const lineHeight = fontSize * 1.4
    const padding = 4
    canvas.width = Math.ceil(maxWidthPx + padding * 2)
    canvas.height = Math.ceil(lines.length * lineHeight + padding * 2)

    // Re-set font after resize
    ctx.font = font
    ctx.fillStyle = color
    ctx.textBaseline = 'top'
    lines.forEach((line, i) => {
      const lineW = ctx.measureText(line).width
      const x = (canvas.width - lineW) / 2
      ctx.fillText(line, x, padding + i * lineHeight)
    })

    return {
      dataUrl: canvas.toDataURL('image/png'),
      widthMm: canvas.width / MM_TO_PX,
      heightMm: canvas.height / MM_TO_PX,
      lines: lines.length,
    }
  } catch {
    return null
  }
}

/**
 * Render an emoji to a canvas data URL.
 */
function emojiToImage(emoji, sizePx = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = sizePx
  canvas.height = sizePx
  const ctx = canvas.getContext('2d')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${sizePx * 0.75}px serif`
  ctx.fillText(emoji, sizePx / 2, sizePx / 2)
  return canvas.toDataURL('image/png')
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 255, g: 255, b: 255 }
}

function drawBackPage(doc, cardW, cardH, backDesign) {
  const style = backDesign?.style || 'simple'
  const color = hexToRgb(backDesign?.color || '#0B1F5C')

  doc.setFillColor(color.r, color.g, color.b)
  doc.roundedRect(0, 0, cardW, cardH, 4, 4, 'F')

  if (style === 'pattern') {
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(0.15)
    const step = 4
    for (let x = -cardH; x < cardW + cardH; x += step) {
      doc.line(x, 0, x + cardH, cardH)
      doc.line(x, cardH, x + cardH, 0)
    }
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(0.5)
    doc.roundedRect(3, 3, cardW - 6, cardH - 6, 3, 3, 'S')
  }

  if (style === 'custom' && backDesign?.image_url) {
    try {
      doc.addImage(backDesign.image_url, 'JPEG', 0, 0, cardW, cardH)
    } catch { /* keep solid color */ }
  }

  // "GB" watermark
  if (style !== 'custom' || !backDesign?.image_url) {
    const gbImg = textToImage('GB', { fontSize: 40, fontWeight: 'bold', color: 'rgba(255,255,255,0.3)', maxWidthMm: cardW })
    if (gbImg) {
      const w = 20
      const h = gbImg.heightMm * (w / gbImg.widthMm)
      try { doc.addImage(gbImg.dataUrl, 'PNG', (cardW - w) / 2, (cardH - h) / 2, w, h) } catch { /* skip */ }
    }
  }
}

/**
 * Generate a PDF with front + back pages for each card.
 * Text is rendered via canvas to support Japanese without font embedding.
 */
export async function generateCardPdf(cards, size = 'poker', filename = 'gamebox_cards_preview.pdf', backDesign = null) {
  const { w: cardW, h: cardH } = SIZE_MM[size] || SIZE_MM.poker
  const padding = 4

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [cardW, cardH],
  })

  let isFirst = true

  for (const card of cards) {
    const repeat = card.count || card.quantity || 1

    for (let r = 0; r < repeat; r++) {
      if (!isFirst) doc.addPage([cardW, cardH])
      isFirst = false

      const design = card.design || {}

      // Fullimage layout: draw image at full card size, no text
      if (design.layout === 'fullimage' && design.image_url) {
        try {
          doc.addImage(design.image_url, 'JPEG', 0, 0, cardW, cardH)
        } catch {
          // Fallback: white card with error text
          doc.setFillColor(255, 255, 255)
          doc.roundedRect(0, 0, cardW, cardH, 4, 4, 'F')
        }

        // Back page
        if (backDesign) {
          doc.addPage([cardW, cardH])
          drawBackPage(doc, cardW, cardH, backDesign)
        }
        continue
      }

      const bgColor = hexToRgb(design.bg_color || '#ffffff')
      const borderColor = hexToRgb(design.border_color || '#0B1F5C')
      const borderHex = design.border_color || '#0B1F5C'

      // Background
      doc.setFillColor(bgColor.r, bgColor.g, bgColor.b)
      doc.roundedRect(0, 0, cardW, cardH, 4, 4, 'F')

      // Border
      doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b)
      doc.setLineWidth(0.8)
      doc.roundedRect(0.4, 0.4, cardW - 0.8, cardH - 0.8, 4, 4, 'S')

      // Title text (top) - rendered as image
      const titleText = design.title_text || card.name || card.type || ''
      let titleBottomY = padding + 2
      if (titleText && (design.layout || 'title-top') !== 'no-title') {
        const titleImg = textToImage(titleText, {
          fontSize: 11,
          fontWeight: 'bold',
          color: borderHex,
          maxWidthMm: cardW - padding * 2,
        })
        if (titleImg) {
          const imgW = cardW - padding * 2
          const imgH = titleImg.heightMm * (imgW / titleImg.widthMm)
          const maxTitleH = 10
          const finalH = Math.min(imgH, maxTitleH)
          const finalW = imgW * (finalH / imgH)
          try {
            doc.addImage(titleImg.dataUrl, 'PNG', (cardW - finalW) / 2, padding, finalW, finalH)
          } catch { /* skip */ }
          titleBottomY = padding + finalH + 1
        }
      }

      // Center area: image or emoji
      if (design.image_url) {
        const imgW = cardW - padding * 4
        const imgH = imgW * (88 / 63)
        const maxH = cardH * 0.45
        const finalH = Math.min(imgH, maxH)
        const finalW = finalH * (63 / 88)
        const imgY = (cardH / 2) - (finalH / 2) - 2
        try {
          doc.addImage(design.image_url, 'JPEG', (cardW - finalW) / 2, imgY, finalW, finalH)
        } catch {
          // fallback to emoji
          try {
            const imgData = emojiToImage(design.icon || '🃏', 128)
            doc.addImage(imgData, 'PNG', (cardW - 14) / 2, imgY, 14, 14)
          } catch { /* skip */ }
        }
      } else {
        const icon = design.icon || '🃏'
        const iconSize = 14
        const iconY = (cardH / 2) - (iconSize / 2) - 2
        try {
          const imgData = emojiToImage(icon, 128)
          doc.addImage(imgData, 'PNG', (cardW - iconSize) / 2, iconY, iconSize, iconSize)
        } catch {
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.rect((cardW - iconSize) / 2, iconY, iconSize, iconSize, 'S')
        }
      }

      // Center text (below icon/image) - rendered as image
      const centerText = design.center_text || ''
      if (centerText) {
        const ctImg = textToImage(centerText, {
          fontSize: 10,
          fontWeight: 'bold',
          color: borderHex,
          maxWidthMm: cardW - padding * 2,
        })
        if (ctImg) {
          const imgW = Math.min(ctImg.widthMm, cardW - padding * 2)
          const imgH = ctImg.heightMm * (imgW / ctImg.widthMm)
          const ctY = design.image_url ? (cardH / 2) + (cardH * 0.2) + 2 : (cardH / 2) + 9
          try { doc.addImage(ctImg.dataUrl, 'PNG', (cardW - imgW) / 2, ctY, imgW, imgH) } catch { /* skip */ }
        }
      }

      // Bottom text - rendered as image
      const bottomText = design.bottom_text || card.description || ''
      if (bottomText) {
        const btImg = textToImage(bottomText, {
          fontSize: 9,
          fontWeight: 'normal',
          color: '#505064',
          maxWidthMm: cardW - padding * 2,
        })
        if (btImg) {
          const imgW = cardW - padding * 2
          const imgH = btImg.heightMm * (imgW / btImg.widthMm)
          const maxBtH = 12
          const finalH = Math.min(imgH, maxBtH)
          const finalW = imgW * (finalH / imgH)
          const startY = cardH - padding - finalH
          try { doc.addImage(btImg.dataUrl, 'PNG', (cardW - finalW) / 2, startY, finalW, finalH) } catch { /* skip */ }
        }
      }

      // Back page
      if (backDesign) {
        doc.addPage([cardW, cardH])
        drawBackPage(doc, cardW, cardH, backDesign)
      }
    }
  }

  doc.save(filename)
}
