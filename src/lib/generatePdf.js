import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { buildCardElement } from './buildCardHtml'

const SIZE_MM = {
  poker: { w: 63, h: 88 },
  bridge: { w: 58, h: 89 },
  mini: { w: 44, h: 63 },
}

// Pixel dimensions for rendering (3px per mm gives good quality at scale:2)
const SIZE_PX = {
  poker: { w: 189, h: 264 },
  bridge: { w: 174, h: 267 },
  mini: { w: 132, h: 189 },
}

/**
 * Generates a PDF with one card per page at actual card size.
 * Uses buildCardElement for consistent rendering with the preview.
 */
export async function generateCardPdf(cards, size = 'poker', filename = 'gamebox_cards_preview.pdf') {
  const mm = SIZE_MM[size] || SIZE_MM.poker
  const px = SIZE_PX[size] || SIZE_PX.poker

  // Create off-screen container
  const container = document.createElement('div')
  container.style.cssText = 'position:absolute;left:-9999px;top:0'
  document.body.appendChild(container)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [mm.w, mm.h] })

  for (let i = 0; i < cards.length; i++) {
    if (i > 0) pdf.addPage([mm.w, mm.h])

    const el = buildCardElement(cards[i], px.w, px.h)
    container.appendChild(el)

    // Temporarily allow overflow so html2canvas captures the full element
    const origOverflow = el.style.overflow
    el.style.overflow = 'visible'

    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      width: el.offsetWidth,
      height: el.offsetHeight,
      windowWidth: el.offsetWidth,
      windowHeight: el.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      logging: false,
    })

    el.style.overflow = origOverflow

    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, mm.w, mm.h)
    container.removeChild(el)
  }

  document.body.removeChild(container)
  pdf.save(filename)
}
