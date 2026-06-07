import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const SIZE_MM = {
  poker: { w: 63, h: 88 },
  bridge: { w: 58, h: 89 },
}

/**
 * Renders each card DOM node to a PDF (one card per page, actual card size).
 * @param {HTMLElement[]} cardElements - array of card DOM elements to capture
 * @param {string} size - 'poker' | 'bridge'
 * @param {string} [filename] - output filename
 */
export async function generateCardPdf(cardElements, size = 'poker', filename = 'gamebox_cards_preview.pdf') {
  const { w, h } = SIZE_MM[size] || SIZE_MM.poker
  const dpi = 150
  const pxPerMm = dpi / 25.4

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [w, h] })

  for (let i = 0; i < cardElements.length; i++) {
    if (i > 0) pdf.addPage([w, h])

    const canvas = await html2canvas(cardElements[i], {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })

    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, w, h)
  }

  pdf.save(filename)
}
