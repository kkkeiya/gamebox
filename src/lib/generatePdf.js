import { jsPDF } from 'jspdf'

const SIZE_MM = {
  poker: { w: 63, h: 88 },
  bridge: { w: 58, h: 89 },
  mini: { w: 44, h: 63 },
}

/**
 * Render an emoji string onto a temporary canvas and return a data URL.
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

/**
 * Draw a single back page.
 */
function drawBackPage(doc, cardW, cardH, backDesign) {
  const style = backDesign?.style || 'simple'
  const color = hexToRgb(backDesign?.color || '#0B1F5C')

  // Fill background
  doc.setFillColor(color.r, color.g, color.b)
  doc.roundedRect(0, 0, cardW, cardH, 4, 4, 'F')

  if (style === 'pattern') {
    // Draw crosshatch lines
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(0.15)
    const step = 4
    for (let x = -cardH; x < cardW + cardH; x += step) {
      doc.line(x, 0, x + cardH, cardH)
      doc.line(x, cardH, x + cardH, 0)
    }
    // Inner border
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(0.5)
    doc.roundedRect(3, 3, cardW - 6, cardH - 6, 3, 3, 'S')
  }

  if (style === 'custom' && backDesign?.image_url) {
    try {
      doc.addImage(backDesign.image_url, 'PNG', 0, 0, cardW, cardH)
    } catch {
      // Fallback: keep solid color
    }
  }

  // Center text "GB"
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  if (style !== 'custom' || !backDesign?.image_url) {
    doc.text('GB', cardW / 2, cardH / 2, { align: 'center' })
  }
}

/**
 * Generate a PDF with front + back pages for each card.
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
      // ── Front page ──
      if (!isFirst) doc.addPage([cardW, cardH])
      isFirst = false

      const design = card.design || {}
      const bgColor = hexToRgb(design.bg_color || '#ffffff')
      const borderColor = hexToRgb(design.border_color || '#0B1F5C')

      // Background
      doc.setFillColor(bgColor.r, bgColor.g, bgColor.b)
      doc.roundedRect(0, 0, cardW, cardH, 4, 4, 'F')

      // Border
      doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b)
      doc.setLineWidth(0.8)
      doc.roundedRect(0.4, 0.4, cardW - 0.8, cardH - 0.8, 4, 4, 'S')

      // Title text (top)
      const titleText = design.title_text || card.name || card.type || ''
      let titleBottomY = padding + 2
      if (titleText && (design.layout || 'title-top') !== 'no-title') {
        doc.setTextColor(borderColor.r, borderColor.g, borderColor.b)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        const titleLines = doc.splitTextToSize(titleText, cardW - padding * 2)
        const maxLines = titleLines.slice(0, 2)
        doc.text(maxLines, cardW / 2, padding + 4, { align: 'center' })
        titleBottomY = padding + 4 + maxLines.length * 4
      }

      // Center area: image or emoji
      if (design.image_url) {
        // Image uploaded by user
        const imgW = cardW - padding * 4
        const imgH = imgW / (63 / 88)
        const maxH = cardH * 0.45
        const finalH = Math.min(imgH, maxH)
        const finalW = finalH * (63 / 88)
        const imgY = (cardH / 2) - (finalH / 2) - 2
        try {
          doc.addImage(design.image_url, 'PNG', (cardW - finalW) / 2, imgY, finalW, finalH)
        } catch {
          // Fallback to emoji
          const icon = design.icon || '🃏'
          const iconSize = 14
          const iconY = (cardH / 2) - (iconSize / 2) - 2
          try {
            const imgData = emojiToImage(icon, 128)
            doc.addImage(imgData, 'PNG', (cardW - iconSize) / 2, iconY, iconSize, iconSize)
          } catch { /* skip */ }
        }
      } else {
        // Emoji icon
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

      // Center text (below icon/image)
      const centerText = design.center_text || ''
      if (centerText) {
        doc.setTextColor(borderColor.r, borderColor.g, borderColor.b)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        const ctY = design.image_url ? (cardH / 2) + (cardH * 0.2) + 4 : (cardH / 2) + 7 + 4
        doc.text(centerText, cardW / 2, ctY, { align: 'center' })
      }

      // Bottom text
      const bottomText = design.bottom_text || card.description || ''
      if (bottomText) {
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 100)
        const bottomLines = doc.splitTextToSize(bottomText, cardW - padding * 2)
        const maxBottomLines = bottomLines.slice(0, 3)
        const lineHeight = 3.5
        const totalHeight = maxBottomLines.length * lineHeight
        const startY = cardH - padding - totalHeight + lineHeight
        doc.text(maxBottomLines, cardW / 2, startY, { align: 'center' })
      }

      // ── Back page ──
      if (backDesign) {
        doc.addPage([cardW, cardH])
        drawBackPage(doc, cardW, cardH, backDesign)
      }
    }
  }

  doc.save(filename)
}
