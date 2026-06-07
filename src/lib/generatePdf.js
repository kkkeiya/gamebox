import { jsPDF } from 'jspdf'

const SIZE_MM = {
  poker: { w: 63, h: 88 },
  bridge: { w: 58, h: 89 },
  mini: { w: 44, h: 63 },
}

/**
 * Render an emoji string onto a temporary canvas and return a data URL.
 * Used because jsPDF cannot render emoji glyphs natively.
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
 * Generate a PDF with one card per page using jsPDF direct drawing.
 * Each card type is repeated by its quantity.
 */
export async function generateCardPdf(cards, size = 'poker', filename = 'gamebox_cards_preview.pdf') {
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
      const bgColor = hexToRgb(design.bg_color || '#ffffff')
      const borderColor = hexToRgb(design.border_color || '#0B1F5C')

      // ── Background ──
      doc.setFillColor(bgColor.r, bgColor.g, bgColor.b)
      doc.roundedRect(0, 0, cardW, cardH, 4, 4, 'F')

      // ── Border ──
      doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b)
      doc.setLineWidth(0.8)
      doc.roundedRect(0.4, 0.4, cardW - 0.8, cardH - 0.8, 4, 4, 'S')

      // ── Title text (top) ──
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

      // ── Center icon (emoji → image) ──
      const icon = design.icon || '🃏'
      const iconSize = 14
      const iconY = (cardH / 2) - (iconSize / 2) - 2
      try {
        const imgData = emojiToImage(icon, 128)
        doc.addImage(imgData, 'PNG', (cardW - iconSize) / 2, iconY, iconSize, iconSize)
      } catch {
        // Fallback: draw placeholder square
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.rect((cardW - iconSize) / 2, iconY, iconSize, iconSize, 'S')
      }

      // ── Center text (below icon) ──
      const centerText = design.center_text || ''
      if (centerText) {
        doc.setTextColor(borderColor.r, borderColor.g, borderColor.b)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(centerText, cardW / 2, iconY + iconSize + 4, { align: 'center' })
      }

      // ── Bottom text ──
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
    }
  }

  doc.save(filename)
}
