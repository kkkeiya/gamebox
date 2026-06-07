/**
 * Builds the innerHTML for a card element used in PDF generation.
 * Font sizes match the preview: S/M/L variants.
 */

const TITLE_SIZES = { S: 12, M: 14, L: 16 }
const BOTTOM_SIZES = { S: 10, M: 12, L: 13 }

export function buildCardInnerHtml(card) {
  const d = card.design || {}
  const layout = d.layout || 'title-top'
  const fs = d.font_size || 'M'
  const borderColor = d.border_color || '#0B1F5C'

  const titleHtml = layout !== 'no-title'
    ? `<div style="width:100%;padding:8px 10px 4px;text-align:center;flex-shrink:0">
        <div style="font-size:${TITLE_SIZES[fs]}px;font-weight:900;color:${borderColor};line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${d.title_text || card.name}</div>
      </div>`
    : ''

  const centerTextHtml = d.center_text
    ? `<span style="font-size:11px;font-weight:700;color:${borderColor};line-height:1.3">${d.center_text}</span>`
    : ''

  const bottomHtml = `<div style="width:100%;padding:4px 10px 8px;text-align:center;flex-shrink:0">
    <div style="font-size:${BOTTOM_SIZES[fs]}px;color:rgba(11,31,92,0.5);line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical">${d.bottom_text || card.description || ''}</div>
  </div>`

  return `${layout === 'title-top' ? titleHtml : ''}<div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;min-height:0"><span style="font-size:48px;line-height:1">${d.icon || '🃏'}</span>${centerTextHtml}</div>${layout === 'title-bottom' ? titleHtml : ''}${bottomHtml}`
}

export function buildCardElement(card, width, height) {
  const d = card.design || {}
  const el = document.createElement('div')
  el.style.cssText = `width:${width}px;height:${height}px;background:${d.bg_color || '#fff'};display:flex;flex-direction:column;align-items:center;font-family:Nunito,sans-serif;overflow:hidden;border-radius:12px;border:3px solid ${d.border_color || '#0B1F5C'};box-sizing:border-box;padding:0`
  el.innerHTML = buildCardInnerHtml(card)
  return el
}
