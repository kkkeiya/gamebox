import { jsPDF } from 'jspdf'

const FACE_W = 74.25 // mm
const FACE_H = 105   // mm
const M = 4          // margin mm
const CONTENT_W = FACE_W - M * 2
const SCALE = 4      // high-res canvas

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

function drawText(doc, text, x, y, options = {}) {
  const {
    fontSize = 7,
    fontWeight = 'normal',
    color = '#111827',
    maxWidthMm = CONTENT_W,
    align = 'left',
    lineHeightRatio = 1.6,
  } = options

  if (!text) return 0

  const MM_TO_PX = 3.7795 * SCALE
  const maxWidthPx = maxWidthMm * MM_TO_PX
  const fontSizePx = fontSize * MM_TO_PX * 0.72

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const font = `${fontWeight} ${fontSizePx}px "Nunito", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif`
  ctx.font = font

  // Word-wrap with paragraph support
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
  canvas.height = Math.ceil(lines.length * lineHeightPx + fontSizePx * 0.5)

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

  const imgHmm = canvas.height / MM_TO_PX
  try {
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, maxWidthMm, imgHmm)
  } catch { /* skip */ }
  return imgHmm
}

function drawEmoji(doc, emoji, cx, cy, sizeMm) {
  const sizePx = sizeMm * 3.7795 * SCALE
  const canvas = document.createElement('canvas')
  canvas.width = sizePx
  canvas.height = sizePx
  const ctx = canvas.getContext('2d')
  ctx.font = `${sizePx * 0.75}px serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(emoji, sizePx / 2, sizePx / 2)
  try {
    doc.addImage(canvas.toDataURL('image/png'), 'PNG',
      cx - sizeMm / 2, cy - sizeMm / 2, sizeMm, sizeMm)
  } catch { /* skip */ }
}

function fillRect(doc, x, y, w, h, hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  doc.setFillColor(r, g, b)
  doc.rect(x, y, w, h, 'F')
}

function drawHeadingBar(doc, text, fx, fy) {
  fillRect(doc, fx, fy, FACE_W, 10, '#0B1F5C')
  drawText(doc, text, fx + M, fy + 1.5, {
    fontSize: 8, fontWeight: 'bold', color: '#FFFFFF', maxWidthMm: FACE_W - M * 2,
  })
  return fy + 14 // return next y position
}

function drawSeparator(doc, fx, y) {
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.setLineDashPattern([], 0)
  doc.line(fx + M, y, fx + FACE_W - M, y)
}

// ─── Face 1: Cover ───
function renderFace1(doc, fx, fy, rules, genre) {
  fillRect(doc, fx, fy, FACE_W, FACE_H, '#0B1F5C')

  const emoji = genre === 'coop' ? '🤝' : '🎭'
  drawEmoji(doc, emoji, fx + FACE_W / 2, fy + 30, 20)

  const title = rules.gameTitle || 'タイトル未設定'
  const titleFontSize = title.length <= 8 ? 14
    : title.length <= 12 ? 11
    : title.length <= 16 ? 9 : 7
  drawText(doc, title, fx + M, fy + 50, {
    fontSize: titleFontSize, fontWeight: 'bold', color: '#FFFFFF',
    maxWidthMm: FACE_W - M * 2, align: 'center',
  })

  const playerStr = `👥 ${rules.players?.min || 2}〜${rules.players?.max || 6}人　⏱ ${rules.duration || '--'}`
  drawText(doc, playerStr, fx + M, fy + 72, {
    fontSize: 7, color: '#CCDDFF', maxWidthMm: FACE_W - M * 2, align: 'center',
  })

  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([], 0)
  doc.line(fx + M, fy + FACE_H - 12, fx + FACE_W - M, fy + FACE_H - 12)

  drawText(doc, 'GameBox', fx + M, fy + FACE_H - 10, {
    fontSize: 7, color: '#FFFFFF', maxWidthMm: FACE_W - M * 2, align: 'center',
  })
}

// ─── Face 2: Overview / World ───
function renderFace2(doc, fx, fy, rules) {
  let y = drawHeadingBar(doc, '2. ゲームの概要', fx, fy)

  const theme = stripMarkdown(rules.theme) || 'このゲームの世界観をここに記載します。'
  drawText(doc, theme, fx + M, y, { fontSize: 7, maxWidthMm: CONTENT_W })
}

// ─── Face 3: Components ① ───
function renderFace3(doc, fx, fy, cards) {
  let y = drawHeadingBar(doc, '1. 内容物', fx, fy)

  const cardMap = {}
  const descMap = {}
  cards.forEach((c) => {
    cardMap[c.name] = (cardMap[c.name] || 0) + (c.count || 1)
    if (!descMap[c.name] && (c.design?.bottom_text || c.description)) {
      descMap[c.name] = c.design?.bottom_text || c.description
    }
  })

  const entries = Object.entries(cardMap)
  const half = Math.ceil(entries.length / 2)
  const firstHalf = entries.slice(0, half)

  for (const [name, count] of firstHalf) {
    y += drawText(doc, `■ ${name}　${count}枚`, fx + M, y, { fontSize: 7, fontWeight: 'bold' })
    if (descMap[name]) {
      y += drawText(doc, `　${stripMarkdown(descMap[name])}`, fx + M, y, { fontSize: 6, color: '#555555', maxWidthMm: CONTENT_W })
    }
    y += 2
    if (y > fy + FACE_H - M) break
  }
}

// ─── Face 4: Components ② ───
function renderFace4(doc, fx, fy, cards) {
  let y = drawHeadingBar(doc, '1. 内容物（つづき）', fx, fy)

  const cardMap = {}
  const descMap = {}
  cards.forEach((c) => {
    cardMap[c.name] = (cardMap[c.name] || 0) + (c.count || 1)
    if (!descMap[c.name] && (c.design?.bottom_text || c.description)) {
      descMap[c.name] = c.design?.bottom_text || c.description
    }
  })

  const entries = Object.entries(cardMap)
  const half = Math.ceil(entries.length / 2)
  const secondHalf = entries.slice(half)

  for (const [name, count] of secondHalf) {
    y += drawText(doc, `■ ${name}　${count}枚`, fx + M, y, { fontSize: 7, fontWeight: 'bold' })
    if (descMap[name]) {
      y += drawText(doc, `　${stripMarkdown(descMap[name])}`, fx + M, y, { fontSize: 6, color: '#555555', maxWidthMm: CONTENT_W })
    }
    y += 2
    if (y > fy + FACE_H - M - 8) break
  }

  // Total
  let total = 0
  Object.values(cardMap).forEach((c) => { total += c })
  y += 3
  drawText(doc, `合計 ${total}枚`, fx + M, y, { fontSize: 7, fontWeight: 'bold', color: '#0B1F5C' })
}

// ─── Face 5: Card Types ① ───
function renderFace5(doc, fx, fy, cards) {
  let y = drawHeadingBar(doc, '2. カードの見方', fx, fy)

  const seen = new Set()
  const unique = []
  cards.forEach((c) => {
    if (!seen.has(c.name)) { seen.add(c.name); unique.push(c) }
  })

  const half = Math.ceil(unique.length / 2)
  const firstHalf = unique.slice(0, half)

  for (const card of firstHalf) {
    const d = card.design || {}
    const icon = d.icon || '🃏'
    drawEmoji(doc, icon, fx + M + 4, y + 4, 7)
    y += drawText(doc, card.name, fx + M + 10, y, { fontSize: 7, fontWeight: 'bold' })
    if (d.bottom_text || card.description) {
      y += drawText(doc, stripMarkdown(d.bottom_text || card.description), fx + M + 10, y, {
        fontSize: 6, color: '#555555', maxWidthMm: CONTENT_W - 10,
      })
    }
    y += 3
    if (y > fy + FACE_H - M) break
  }
}

// ─── Face 6: Card Types ② ───
function renderFace6(doc, fx, fy, cards) {
  let y = drawHeadingBar(doc, '2. カードの見方（つづき）', fx, fy)

  const seen = new Set()
  const unique = []
  cards.forEach((c) => {
    if (!seen.has(c.name)) { seen.add(c.name); unique.push(c) }
  })

  const half = Math.ceil(unique.length / 2)
  const secondHalf = unique.slice(half)

  if (secondHalf.length === 0) {
    drawText(doc, '特記事項なし', fx + M, y, { fontSize: 7, color: '#555555' })
    return
  }

  for (const card of secondHalf) {
    const d = card.design || {}
    const icon = d.icon || '🃏'
    drawEmoji(doc, icon, fx + M + 4, y + 4, 7)
    y += drawText(doc, card.name, fx + M + 10, y, { fontSize: 7, fontWeight: 'bold' })
    if (d.bottom_text || card.description) {
      y += drawText(doc, stripMarkdown(d.bottom_text || card.description), fx + M + 10, y, {
        fontSize: 6, color: '#555555', maxWidthMm: CONTENT_W - 10,
      })
    }
    y += 3
    if (y > fy + FACE_H - M) break
  }
}

// ─── Face 7: Win Conditions ───
function renderFace7(doc, fx, fy, rules) {
  let y = drawHeadingBar(doc, '3. ゲームの終了と勝利条件', fx, fy)

  const factions = rules.factions || []
  if (factions.length === 0) {
    drawText(doc, '勝利条件は設定されていません。', fx + M, y, { fontSize: 7, color: '#555555' })
    return
  }

  for (const f of factions) {
    if (!f.name && !f.winCondition) continue
    y += drawText(doc, `【${f.name || '陣営'}】`, fx + M, y, { fontSize: 7, fontWeight: 'bold' })
    if (f.winCondition) {
      y += drawText(doc, stripMarkdown(f.winCondition), fx + M, y, { fontSize: 7, maxWidthMm: CONTENT_W })
    }
    y += 3
    if (y > fy + FACE_H - M) break
  }
}

// ─── Face 8: Setup ───
function renderFace8(doc, fx, fy, rules) {
  let y = drawHeadingBar(doc, '4. ゲームの準備', fx, fy)

  const setupPhase = (rules.phases || []).find((p) =>
    /準備|セットアップ|setup/i.test(p.name || '')
  )

  if (setupPhase && setupPhase.content) {
    drawText(doc, stripMarkdown(setupPhase.content), fx + M, y, { fontSize: 7, maxWidthMm: CONTENT_W })
  } else {
    const defaultSteps = [
      '① カードをよくシャッフルする',
      '② 各プレイヤーに手札を配る',
      '③ 残りを山札として中央に置く',
      '④ 最初のプレイヤーを決める',
    ]
    for (const step of defaultSteps) {
      y += drawText(doc, step, fx + M, y, { fontSize: 7 })
      y += 2
    }
  }
}

// ─── Faces 9-12: Game Flow (4 faces) ───
function renderGameFlowFace(doc, fx, fy, rules, chunkIndex, totalChunks) {
  const phases = (rules.phases || []).filter((p) =>
    !/準備|セットアップ|setup/i.test(p.name || '')
  )

  const label = `5. ゲームの流れ（${chunkIndex + 1}/${totalChunks}）`
  let y = drawHeadingBar(doc, label, fx, fy)

  if (phases.length === 0) {
    if (chunkIndex === 0) {
      drawText(doc, 'ゲームの流れは設定されていません。', fx + M, y, { fontSize: 7, color: '#555555' })
    }
    return
  }

  const chunk = Math.ceil(phases.length / totalChunks) || 1
  const start = chunkIndex * chunk
  const slice = phases.slice(start, start + chunk)
  const circleNums = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮']

  for (let i = 0; i < slice.length; i++) {
    const p = slice[i]
    const globalIdx = start + i
    const num = circleNums[globalIdx] || `${globalIdx + 1}.`
    y += drawText(doc, `${num} ${p.name || 'フェーズ'}`, fx + M, y, { fontSize: 7, fontWeight: 'bold' })
    y += 1
    if (p.content) {
      y += drawText(doc, stripMarkdown(p.content), fx + M + 2, y, { fontSize: 6.5, maxWidthMm: CONTENT_W - 2 })
    }
    if (p.endCondition) {
      y += 1
      y += drawText(doc, `→ ${stripMarkdown(p.endCondition)}`, fx + M + 2, y, { fontSize: 6, color: '#555555', maxWidthMm: CONTENT_W - 2 })
    }
    y += 2
    if (i < slice.length - 1) {
      drawSeparator(doc, fx, y)
      y += 2
    }
    if (y > fy + FACE_H - M) break
  }
}

function renderFace9(doc, fx, fy, rules) { renderGameFlowFace(doc, fx, fy, rules, 0, 4) }
function renderFace10(doc, fx, fy, rules) { renderGameFlowFace(doc, fx, fy, rules, 1, 4) }
function renderFace11(doc, fx, fy, rules) { renderGameFlowFace(doc, fx, fy, rules, 2, 4) }
function renderFace12(doc, fx, fy, rules) { renderGameFlowFace(doc, fx, fy, rules, 3, 4) }

// ─── Faces 13-15: Special Rules (3 faces) ───
function renderSpecialRuleFace(doc, fx, fy, rules, chunkIndex, totalChunks) {
  const specials = [
    ...(rules.specialRules || []).map((r) => ({ title: r.title, desc: r.description })),
    ...((rules.sections || [])
      .filter((s) => s.type === 'custom' && rules.customSections?.[s.id])
      .map((s) => ({ title: s.title, desc: rules.customSections[s.id] }))),
  ]

  const label = '6. 特別ルール・用語解説'
  let y = drawHeadingBar(doc, label, fx, fy)

  if (specials.length === 0) {
    if (chunkIndex === 0) {
      drawText(doc, '特別ルールはありません。', fx + M, y, { fontSize: 7, color: '#555555' })
    }
    return
  }

  const chunk = Math.ceil(specials.length / totalChunks) || 1
  const start = chunkIndex * chunk
  const slice = specials.slice(start, start + chunk)

  for (const item of slice) {
    if (!item.title && !item.desc) continue
    y += drawText(doc, `▶ ${item.title || 'ルール'}`, fx + M, y, { fontSize: 7, fontWeight: 'bold' })
    y += 1
    if (item.desc) {
      y += drawText(doc, stripMarkdown(item.desc), fx + M + 2, y, { fontSize: 6.5, maxWidthMm: CONTENT_W - 2 })
    }
    y += 3
    if (y > fy + FACE_H - M) break
  }
}

function renderFace13(doc, fx, fy, rules) { renderSpecialRuleFace(doc, fx, fy, rules, 0, 3) }
function renderFace14(doc, fx, fy, rules) { renderSpecialRuleFace(doc, fx, fy, rules, 1, 3) }
function renderFace15(doc, fx, fy, rules) { renderSpecialRuleFace(doc, fx, fy, rules, 2, 3) }

// ─── Face 16: Back Cover ───
function renderFace16(doc, fx, fy, rules) {
  fillRect(doc, fx, fy, FACE_W, FACE_H, '#0B1F5C')

  drawText(doc, 'GameBox', fx + M, fy + 30, {
    fontSize: 16, fontWeight: 'bold', color: '#FFFFFF',
    maxWidthMm: CONTENT_W, align: 'center',
  })

  drawText(doc, '頭の中のゲームをこの世に引っ張り出す', fx + M, fy + 50, {
    fontSize: 6, color: '#AACCFF', maxWidthMm: CONTENT_W, align: 'center',
  })

  // Separator
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([], 0)
  doc.line(fx + M + 15, fy + 60, fx + FACE_W - M - 15, fy + 60)

  drawText(doc, rules.gameTitle || 'Game', fx + M, fy + 65, {
    fontSize: 8, fontWeight: 'bold', color: '#FFFFFF',
    maxWidthMm: CONTENT_W, align: 'center',
  })

  const now = new Date()
  drawText(doc, `${now.getFullYear()}年${now.getMonth() + 1}月制作`, fx + M, fy + 76, {
    fontSize: 6, color: '#AACCFF', maxWidthMm: CONTENT_W, align: 'center',
  })

  drawText(doc, `© ${now.getFullYear()} GameBox`, fx + M, fy + FACE_H - 10, {
    fontSize: 5, color: '#7799BB', maxWidthMm: CONTENT_W, align: 'center',
  })
}

// ─── Fold Guides ───
function drawFoldGuides(doc) {
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([2, 2], 0)
  ;[74.25, 148.5, 222.75].forEach((x) => {
    doc.line(x, 0, x, 210)
  })
  doc.line(0, 105, 297, 105)
  doc.setLineDashPattern([], 0)

  drawText(doc, '※ 点線で折ってください（巻き折り4つ折り）', 297 - 70, 1.5, {
    fontSize: 5, color: '#AAAAAA', maxWidthMm: 68, align: 'right',
  })
}

// ─── Main Export ───
export async function generateRulebook(state) {
  const { rules, cards = [], genre } = state

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // Page 1 (front)
  drawFoldGuides(doc)
  renderFace1(doc, 0, 0, rules, genre)
  renderFace2(doc, 74.25, 0, rules)
  renderFace5(doc, 148.5, 0, cards)
  renderFace6(doc, 222.75, 0, cards)
  renderFace3(doc, 0, 105, cards)
  renderFace4(doc, 74.25, 105, cards)
  renderFace7(doc, 148.5, 105, rules)
  renderFace8(doc, 222.75, 105, rules)

  // Page 2 (back)
  doc.addPage()
  drawFoldGuides(doc)
  renderFace9(doc, 0, 0, rules)
  renderFace10(doc, 74.25, 0, rules)
  renderFace13(doc, 148.5, 0, rules)
  renderFace14(doc, 222.75, 0, rules)
  renderFace11(doc, 0, 105, rules)
  renderFace12(doc, 74.25, 105, rules)
  renderFace15(doc, 148.5, 105, rules)
  renderFace16(doc, 222.75, 105, rules)

  const title = rules?.gameTitle || 'rulebook'
  doc.save(`${title}_rulebook.pdf`)
}
