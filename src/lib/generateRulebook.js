import { jsPDF } from 'jspdf'

const FACE_W = 74.25 // mm
const FACE_H = 105   // mm
const MARGIN = 5     // mm
const CONTENT_W = FACE_W - MARGIN * 2 // 64.25mm
const MM_TO_PX = 3.7795

function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-*+]\s/gm, '・')
    .replace(/^\d+\.\s/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/**
 * Draw text via canvas and place as image in PDF.
 * Returns the height used (mm).
 */
function drawText(doc, text, x, y, options = {}) {
  const {
    fontSize = 10,
    fontWeight = 'normal',
    color = '#111827',
    maxWidthMm = CONTENT_W,
    align = 'left',
    lineHeightRatio = 1.5,
  } = options

  if (!text) return 0

  const maxWidthPx = maxWidthMm * MM_TO_PX
  const fontSizePx = fontSize * MM_TO_PX * 0.8

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const font = `${fontWeight} ${fontSizePx}px "Nunito", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif`
  ctx.font = font

  // Word-wrap
  const lines = []
  const paragraphs = text.split('\n')
  for (const para of paragraphs) {
    if (!para) { lines.push(''); continue }
    let line = ''
    for (const ch of para) {
      if (ctx.measureText(line + ch).width > maxWidthPx && line) {
        lines.push(line)
        line = ch
      } else {
        line += ch
      }
    }
    if (line) lines.push(line)
  }

  const lineHeightPx = fontSizePx * lineHeightRatio
  canvas.width = Math.ceil(maxWidthPx)
  canvas.height = Math.ceil(lines.length * lineHeightPx + 4)

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = font
  ctx.fillStyle = color
  ctx.textBaseline = 'top'

  lines.forEach((l, i) => {
    if (!l) return
    let xPos = 0
    if (align === 'center') xPos = (canvas.width - ctx.measureText(l).width) / 2
    if (align === 'right') xPos = canvas.width - ctx.measureText(l).width
    ctx.fillText(l, xPos, i * lineHeightPx)
  })

  const dataUrl = canvas.toDataURL('image/png')
  const imgH = canvas.height / MM_TO_PX

  try {
    doc.addImage(dataUrl, 'PNG', x, y, maxWidthMm, imgH)
  } catch { /* skip */ }

  return imgH
}

/**
 * Draw a section heading and return height used.
 */
function drawHeading(doc, text, x, y) {
  return drawText(doc, text, x, y, {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0B1F5C',
  })
}

// ─── Face 1: Cover ───
function renderFace1(doc, rules, genre) {
  // Background
  doc.setFillColor(11, 31, 92)
  doc.rect(0, 0, FACE_W, FACE_H, 'F')

  // Genre icon
  const icon = genre === 'coop' ? '🤝' : '🎭'
  drawText(doc, icon, MARGIN, 20, { fontSize: 24, align: 'center', color: '#ffffff', maxWidthMm: CONTENT_W })

  // Title
  drawText(doc, rules.gameTitle || 'Untitled Game', MARGIN, 48, {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    align: 'center',
    maxWidthMm: CONTENT_W,
  })

  // Player count & duration
  const players = rules.players
  const playerText = players ? `👥 ${players.min || 2}〜${players.max || 6}人` : ''
  const durationText = rules.duration ? `⏱ ${rules.duration}` : ''
  const infoText = [playerText, durationText].filter(Boolean).join('　')
  drawText(doc, infoText, MARGIN, 68, { fontSize: 8, color: '#ffffff', align: 'center', maxWidthMm: CONTENT_W })

  // Bottom credit
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.2)
  doc.line(MARGIN + 10, FACE_H - 14, FACE_W - MARGIN - 10, FACE_H - 14)
  drawText(doc, 'GameBox', MARGIN, FACE_H - 11, { fontSize: 6, color: '#ffffff', align: 'center', maxWidthMm: CONTENT_W })
}

// ─── Face 2: Setup ───
function renderFace2(doc, rules, cards) {
  let y = MARGIN
  y += drawHeading(doc, '準備のしかた', MARGIN, y)
  y += 2

  // Find setup phase
  const setupPhase = (rules.phases || []).find((p) =>
    /準備|セットアップ|setup/i.test(p.name || '')
  )

  if (setupPhase && setupPhase.content) {
    y += drawText(doc, stripMarkdown(setupPhase.content), MARGIN, y, { fontSize: 8 })
  } else {
    y += drawText(doc, 'カードをよくシャッフルして、各プレイヤーに配ってください。', MARGIN, y, { fontSize: 8 })
  }

  y += 4
  y += drawText(doc, '【カード構成】', MARGIN, y, { fontSize: 8, fontWeight: 'bold', color: '#0B1F5C' })
  y += 1

  // Card breakdown
  const cardMap = {}
  cards.forEach((c) => { cardMap[c.name] = (cardMap[c.name] || 0) + (c.count || 1) })
  const breakdown = Object.entries(cardMap).map(([name, count]) => `・${name}：${count}枚`).join('\n')
  drawText(doc, breakdown, MARGIN, y, { fontSize: 7.5 })
}

// ─── Face 3: Objective & Win Conditions ───
function renderFace3(doc, rules) {
  let y = MARGIN
  y += drawHeading(doc, 'このゲームの目的', MARGIN, y)
  y += 2

  if (rules.theme) {
    y += drawText(doc, stripMarkdown(rules.theme), MARGIN, y, { fontSize: 8 })
    y += 3
  }

  y += drawText(doc, '勝利条件', MARGIN, y, { fontSize: 10, fontWeight: 'bold', color: '#0B1F5C' })
  y += 2

  const factions = rules.factions || []
  for (const f of factions) {
    if (!f.name && !f.winCondition) continue
    y += drawText(doc, `■ ${f.name || '陣営'}`, MARGIN, y, { fontSize: 8, fontWeight: 'bold' })
    y += 1
    if (f.winCondition) {
      y += drawText(doc, stripMarkdown(f.winCondition), MARGIN + 2, y, { fontSize: 7.5, maxWidthMm: CONTENT_W - 2 })
    }
    y += 2
    if (y > FACE_H - MARGIN) break
  }
}

// ─── Face 4: Components ───
function renderFace4(doc, cards) {
  let y = MARGIN
  y += drawHeading(doc, '内容物', MARGIN, y)
  y += 2

  const cardMap = {}
  const descMap = {}
  cards.forEach((c) => {
    cardMap[c.name] = (cardMap[c.name] || 0) + (c.count || 1)
    if (!descMap[c.name] && (c.design?.bottom_text || c.description)) {
      descMap[c.name] = c.design?.bottom_text || c.description
    }
  })

  let total = 0
  for (const [name, count] of Object.entries(cardMap)) {
    total += count
    y += drawText(doc, `■ ${name}　${count}枚`, MARGIN, y, { fontSize: 8, fontWeight: 'bold' })
    if (descMap[name]) {
      y += drawText(doc, stripMarkdown(descMap[name]), MARGIN + 2, y, { fontSize: 7, color: '#555555', maxWidthMm: CONTENT_W - 2 })
    }
    y += 2
    if (y > FACE_H - MARGIN - 8) break
  }

  y += 3
  drawText(doc, `合計 ${total}枚`, MARGIN, y, { fontSize: 9, fontWeight: 'bold', color: '#0B1F5C' })
}

// ─── Face 5: Game Flow ───
function renderFace5(doc, rules) {
  let y = MARGIN
  y += drawHeading(doc, 'ゲームの流れ', MARGIN, y)
  y += 2

  const phases = (rules.phases || []).filter((p) =>
    !/準備|セットアップ|setup/i.test(p.name || '')
  )
  const circleNums = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']

  for (let i = 0; i < phases.length; i++) {
    const p = phases[i]
    const num = circleNums[i] || `${i + 1}.`
    y += drawText(doc, `${num} ${p.name || 'フェーズ'}`, MARGIN, y, { fontSize: 8.5, fontWeight: 'bold' })
    y += 1
    if (p.content) {
      y += drawText(doc, stripMarkdown(p.content), MARGIN + 2, y, { fontSize: 7.5, maxWidthMm: CONTENT_W - 2 })
    }
    if (p.endCondition) {
      y += 1
      y += drawText(doc, `→ ${stripMarkdown(p.endCondition)}`, MARGIN + 2, y, { fontSize: 7, color: '#555555', maxWidthMm: CONTENT_W - 2 })
    }
    y += 3
    if (y > FACE_H - MARGIN) break
  }
}

// ─── Face 6: Special Rules ───
function renderFace6(doc, rules) {
  let y = MARGIN
  y += drawHeading(doc, '特別ルール', MARGIN, y)
  y += 2

  const specials = rules.specialRules || []
  if (specials.length === 0) {
    y += drawText(doc, '特別ルールはありません。', MARGIN, y, { fontSize: 8, color: '#555555' })
  } else {
    for (const r of specials) {
      if (!r.title && !r.description) continue
      y += drawText(doc, `▶ ${r.title || 'ルール'}`, MARGIN, y, { fontSize: 8.5, fontWeight: 'bold' })
      y += 1
      if (r.description) {
        y += drawText(doc, stripMarkdown(r.description), MARGIN + 2, y, { fontSize: 7.5, maxWidthMm: CONTENT_W - 2 })
      }
      y += 3
      if (y > FACE_H - MARGIN) break
    }
  }

  // Custom sections
  const customSections = rules.customSections || {}
  const sectionEntries = Object.entries(customSections).filter(([, v]) => v)
  if (sectionEntries.length > 0 && y < FACE_H - MARGIN - 10) {
    y += 3
    for (const [key, val] of sectionEntries) {
      const sectionDef = (rules.sections || []).find((s) => s.id === key)
      const title = sectionDef?.title || key
      y += drawText(doc, `▶ ${title}`, MARGIN, y, { fontSize: 8.5, fontWeight: 'bold' })
      y += 1
      y += drawText(doc, stripMarkdown(val), MARGIN + 2, y, { fontSize: 7.5, maxWidthMm: CONTENT_W - 2 })
      y += 3
      if (y > FACE_H - MARGIN) break
    }
  }
}

// ─── Face 7: FAQ ───
function renderFace7(doc, rules) {
  let y = MARGIN
  y += drawHeading(doc, 'よくある質問', MARGIN, y)
  y += 2

  // Use AI feedback if available
  const feedback = rules._aiFeedback
  const hasFeedback = feedback?.issues?.some((i) => i.type === 'warning' || i.type === 'suggestion')

  if (hasFeedback) {
    const items = feedback.issues.filter((i) => i.type === 'warning' || i.type === 'suggestion')
    for (const item of items.slice(0, 4)) {
      y += drawText(doc, `Q: ${item.title}`, MARGIN, y, { fontSize: 8, fontWeight: 'bold' })
      y += 1
      y += drawText(doc, `A: ${item.fix}`, MARGIN + 2, y, { fontSize: 7.5, maxWidthMm: CONTENT_W - 2 })
      y += 3
      if (y > FACE_H - MARGIN) break
    }
  } else {
    // Default FAQ
    const defaultFaq = [
      { q: 'カードを引く順番は決まっていますか？', a: '特に指定がない限り、時計回りに進めてください。' },
      { q: 'ルールで不明な点があったら？', a: 'プレイヤー全員で相談して決めてください。楽しさ優先で！' },
    ]
    for (const faq of defaultFaq) {
      y += drawText(doc, `Q: ${faq.q}`, MARGIN, y, { fontSize: 8, fontWeight: 'bold' })
      y += 1
      y += drawText(doc, `A: ${faq.a}`, MARGIN + 2, y, { fontSize: 7.5, maxWidthMm: CONTENT_W - 2 })
      y += 4
    }
  }
}

// ─── Face 8: Back Cover ───
function renderFace8(doc, rules) {
  // Background
  doc.setFillColor(11, 31, 92)
  doc.rect(0, 0, FACE_W, FACE_H, 'F')

  // Logo
  drawText(doc, 'GameBox', MARGIN, 36, {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    align: 'center',
    maxWidthMm: CONTENT_W,
  })

  // Tagline
  drawText(doc, '頭の中のゲームをこの世に引っ張り出す', MARGIN, 55, {
    fontSize: 7,
    color: '#ffffff',
    align: 'center',
    maxWidthMm: CONTENT_W,
  })

  // Creator info
  const dateStr = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
  drawText(doc, `${rules.gameTitle || 'Game'} ─ ${dateStr}制作`, MARGIN, 75, {
    fontSize: 6,
    color: '#ffffff',
    align: 'center',
    maxWidthMm: CONTENT_W,
  })

  // Bottom
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.2)
  doc.line(MARGIN + 10, FACE_H - 14, FACE_W - MARGIN - 10, FACE_H - 14)
  drawText(doc, 'Printed by GameBox × 萬印堂', MARGIN, FACE_H - 11, {
    fontSize: 5.5,
    color: '#ffffff',
    align: 'center',
    maxWidthMm: CONTENT_W,
  })
}

/**
 * Generate an 8-face rulebook PDF.
 */
export async function generateRulebook(state) {
  const { rules, cards, genre } = state

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [FACE_W, FACE_H],
  })

  renderFace1(doc, rules, genre)
  doc.addPage([FACE_W, FACE_H])
  renderFace2(doc, rules, cards)
  doc.addPage([FACE_W, FACE_H])
  renderFace3(doc, rules)
  doc.addPage([FACE_W, FACE_H])
  renderFace4(doc, cards)
  doc.addPage([FACE_W, FACE_H])
  renderFace5(doc, rules)
  doc.addPage([FACE_W, FACE_H])
  renderFace6(doc, rules)
  doc.addPage([FACE_W, FACE_H])
  renderFace7(doc, rules)
  doc.addPage([FACE_W, FACE_H])
  renderFace8(doc, rules)

  doc.save(`${rules.gameTitle || 'rulebook'}_rulebook.pdf`)
}
