import { jsPDF } from 'jspdf'

// ─── Layout constants ───
const FACE_W = 74.25 // mm (A4 landscape / 4)
const FACE_H = 105   // mm (A4 landscape / 2)
const M = 5          // face inner margin mm
const CONTENT_W = FACE_W - M * 2
const SCALE = 5      // canvas supersampling (≈480dpi text)
const MM_TO_PX = 3.7795 * SCALE
const PT_TO_MM = 0.3528
const FONT_STACK = '"Nunito", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'

const HEAD_H = 10          // heading bar height mm
const CONTENT_TOP = HEAD_H + 4.5
const FOOTER_RESERVE = 8   // space reserved for page number
const AVAIL_H = FACE_H - CONTENT_TOP - FOOTER_RESERVE

const C = {
  navy: '#0B1F5C',
  accent: '#FFD233',
  body: '#1F2937',
  sub: '#667085',
  faint: '#98A2B3',
  white: '#FFFFFF',
}

// shared canvas for text measurement
const measureCtx = document.createElement('canvas').getContext('2d')

function fontOf(pt, weight = 'normal') {
  return `${weight} ${pt * PT_TO_MM * MM_TO_PX}px ${FONT_STACK}`
}

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

// ─── Text engine (measure + render share the same wrapping) ───
function wrapLines(text, pt, weight, maxWidthMm) {
  measureCtx.font = fontOf(pt, weight)
  const maxPx = maxWidthMm * MM_TO_PX
  const lines = []
  for (const para of String(text).split('\n')) {
    if (!para) { lines.push(''); continue }
    let line = ''
    for (const ch of para) {
      if (line && measureCtx.measureText(line + ch).width > maxPx) {
        lines.push(line)
        line = ch
      } else {
        line += ch
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

function textHeightMm(text, { pt = 8, weight = 'normal', maxWidthMm = CONTENT_W, lh = 1.55 } = {}) {
  if (!text) return 0
  const lines = wrapLines(text, pt, weight, maxWidthMm)
  const fontMm = pt * PT_TO_MM
  return lines.length * fontMm * lh + fontMm * 0.3
}

function drawText(doc, text, x, y, opts = {}) {
  const {
    pt = 8, weight = 'normal', color = C.body,
    maxWidthMm = CONTENT_W, align = 'left', lh = 1.55,
  } = opts
  if (!text) return 0

  const lines = wrapLines(text, pt, weight, maxWidthMm)
  const fontPx = pt * PT_TO_MM * MM_TO_PX
  const lineHpx = fontPx * lh

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(maxWidthMm * MM_TO_PX)
  canvas.height = Math.ceil(lines.length * lineHpx + fontPx * 0.3)
  const ctx = canvas.getContext('2d')
  ctx.font = fontOf(pt, weight)
  ctx.fillStyle = color
  ctx.textBaseline = 'top'
  lines.forEach((l, i) => {
    if (!l) return
    let xPos = 0
    const w = ctx.measureText(l).width
    if (align === 'center') xPos = (canvas.width - w) / 2
    if (align === 'right') xPos = canvas.width - w
    ctx.fillText(l, xPos, i * lineHpx + fontPx * (lh - 1) / 2)
  })

  const hMm = canvas.height / MM_TO_PX
  try {
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, maxWidthMm, hMm)
  } catch { /* canvas may be blank */ }
  return hMm
}

function drawEmoji(doc, emoji, cx, cy, sizeMm) {
  const sizePx = Math.ceil(sizeMm * MM_TO_PX)
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

// ─── Block layout engine ───
// block: { text, pt, weight, color, indent, lh, gapBefore, gapAfter, icon, iconSize }
//        { sep: true, gapBefore, gapAfter }
function blockHeight(b, k) {
  const gaps = ((b.gapBefore || 0) + (b.gapAfter || 0)) * k
  if (b.sep) return gaps + 0.4
  const w = CONTENT_W - (b.indent || 0)
  const th = textHeightMm(b.text, { pt: (b.pt || 8) * k, weight: b.weight, maxWidthMm: w, lh: b.lh })
  const ih = b.icon ? (b.iconSize || 6) * k : 0
  return gaps + Math.max(th, ih)
}

function blocksHeight(blocks, k) {
  return blocks.reduce((s, b) => s + blockHeight(b, k), 0)
}

const FIT_SCALES = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7]

// Renders blocks inside a face, shrinking typography until content fits.
function renderBlocks(doc, faceX, startY, blocks, availH = AVAIL_H) {
  if (!blocks.length) return
  let k = FIT_SCALES.find((s) => blocksHeight(blocks, s) <= availH)
  let truncating = false
  if (!k) { k = FIT_SCALES[FIT_SCALES.length - 1]; truncating = true }

  let y = startY
  const limit = startY + availH
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const h = blockHeight(b, k)
    if (truncating && y + h > limit - 3) {
      drawText(doc, '…', faceX + M, y, { pt: 8 * k, color: C.faint, maxWidthMm: CONTENT_W })
      break
    }
    y += (b.gapBefore || 0) * k
    if (b.sep) {
      doc.setDrawColor(208, 213, 221)
      doc.setLineWidth(0.2)
      doc.setLineDashPattern([], 0)
      doc.line(faceX + M, y + 0.2, faceX + FACE_W - M, y + 0.2)
      y += 0.4
    } else {
      const indent = b.indent || 0
      if (b.icon) {
        const isz = (b.iconSize || 6) * k
        drawEmoji(doc, b.icon, faceX + M + isz / 2, y + isz / 2, isz)
      }
      const th = drawText(doc, b.text, faceX + M + indent, y, {
        pt: (b.pt || 8) * k,
        weight: b.weight,
        color: b.color,
        maxWidthMm: CONTENT_W - indent,
        align: b.align,
        lh: b.lh,
      })
      y += Math.max(th, b.icon ? (b.iconSize || 6) * k : 0)
    }
    y += (b.gapAfter || 0) * k
  }
}

// Distribute items (arrays of blocks) into faceCount faces by measured height.
function packItems(items, faceCount, availH = AVAIL_H) {
  const faces = Array.from({ length: faceCount }, () => [])
  let fi = 0
  let used = 0
  for (const item of items) {
    const h = item.reduce((s, b) => s + blockHeight(b, 1), 0)
    if (used + h > availH && faces[fi].length > 0 && fi < faceCount - 1) {
      fi += 1
      used = 0
    }
    faces[fi].push(...item)
    used += h
  }
  // remove dangling separators at the edges of each face
  for (const face of faces) {
    while (face.length && face[0].sep) face.shift()
    while (face.length && face[face.length - 1].sep) face.pop()
  }
  return faces
}

// ─── Face chrome ───
function faceHeading(doc, fx, fy, text) {
  fillRect(doc, fx, fy, FACE_W, HEAD_H, C.navy)
  fillRect(doc, fx, fy, 1.6, HEAD_H, C.accent)
  drawText(doc, text, fx + M, fy + 3, {
    pt: 10, weight: 'bold', color: C.white, maxWidthMm: FACE_W - M * 2, lh: 1.1,
  })
  return fy + CONTENT_TOP
}

function facePageNum(doc, fx, fy, n) {
  drawText(doc, `${n}`, fx + M, fy + FACE_H - 6.5, {
    pt: 6.5, color: C.faint, maxWidthMm: CONTENT_W, align: 'center', lh: 1,
  })
}

function renderContentFace(doc, fx, fy, title, blocks, pageNum) {
  const y0 = faceHeading(doc, fx, fy, title)
  renderBlocks(doc, fx, y0, blocks)
  facePageNum(doc, fx, fy, pageNum)
}

function renderMemoFace(doc, fx, fy, pageNum) {
  const y0 = faceHeading(doc, fx, fy, 'メモ')
  doc.setDrawColor(214, 219, 230)
  doc.setLineWidth(0.2)
  doc.setLineDashPattern([], 0)
  for (let y = y0 + 8; y < fy + FACE_H - FOOTER_RESERVE; y += 9) {
    doc.line(fx + M, y, fx + FACE_W - M, y)
  }
  facePageNum(doc, fx, fy, pageNum)
}

// ─── Cover (page 1) ───
function renderCover(doc, fx, fy, rules, genre) {
  fillRect(doc, fx, fy, FACE_W, FACE_H, C.navy)

  drawEmoji(doc, genre === 'coop' ? '🤝' : '🎭', fx + FACE_W / 2, fy + 26, 18)

  drawText(doc, genre === 'coop' ? '協力ゲーム' : 'パーティーゲーム', fx + M, fy + 39, {
    pt: 8, weight: 'bold', color: C.accent, maxWidthMm: CONTENT_W, align: 'center', lh: 1.2,
  })

  const title = rules.gameTitle || 'タイトル未設定'
  const titlePt = [22, 19, 16, 14, 12, 10].find(
    (pt) => wrapLines(title, pt, 'bold', CONTENT_W).length <= 2
  ) || 10
  let y = fy + 48
  y += drawText(doc, title, fx + M, y, {
    pt: titlePt, weight: 'bold', color: C.white,
    maxWidthMm: CONTENT_W, align: 'center', lh: 1.25,
  })

  // accent underline
  fillRect(doc, fx + FACE_W / 2 - 7, y + 2.5, 14, 0.8, C.accent)
  y += 8

  const playerStr = `${rules.players?.min || 2}〜${rules.players?.max || 6}人 ／ ${rules.duration || '時間未設定'}`
  drawText(doc, playerStr, fx + M, y, {
    pt: 8.5, color: '#C7D4F5', maxWidthMm: CONTENT_W, align: 'center', lh: 1.4,
  })

  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([], 0)
  doc.line(fx + M, fy + FACE_H - 12, fx + FACE_W - M, fy + FACE_H - 12)
  drawText(doc, 'GameBox', fx + M, fy + FACE_H - 9.5, {
    pt: 7.5, weight: 'bold', color: C.white, maxWidthMm: CONTENT_W, align: 'center', lh: 1.2,
  })
}

// ─── Back cover (page 16) ───
function renderBackCover(doc, fx, fy, rules) {
  fillRect(doc, fx, fy, FACE_W, FACE_H, C.navy)

  drawText(doc, 'GameBox', fx + M, fy + 30, {
    pt: 18, weight: 'bold', color: C.white, maxWidthMm: CONTENT_W, align: 'center', lh: 1.2,
  })
  drawText(doc, '頭の中のゲームをこの世に引っ張り出す', fx + M, fy + 42, {
    pt: 7, color: '#AACCFF', maxWidthMm: CONTENT_W, align: 'center', lh: 1.4,
  })

  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([], 0)
  doc.line(fx + M + 15, fy + 56, fx + FACE_W - M - 15, fy + 56)

  drawText(doc, rules.gameTitle || 'Game', fx + M, fy + 61, {
    pt: 10, weight: 'bold', color: C.white, maxWidthMm: CONTENT_W, align: 'center', lh: 1.3,
  })
  const now = new Date()
  drawText(doc, `${now.getFullYear()}年${now.getMonth() + 1}月制作`, fx + M, fy + 72, {
    pt: 7, color: '#AACCFF', maxWidthMm: CONTENT_W, align: 'center', lh: 1.4,
  })
  drawText(doc, `© ${now.getFullYear()} GameBox`, fx + M, fy + FACE_H - 9, {
    pt: 6, color: '#7799BB', maxWidthMm: CONTENT_W, align: 'center', lh: 1.2,
  })
}

// ─── Content builders ───
function buildComponentItems(cards) {
  const cardMap = {}
  const descMap = {}
  cards.forEach((c) => {
    cardMap[c.name] = (cardMap[c.name] || 0) + (c.count || 1)
    if (!descMap[c.name] && (c.design?.bottom_text || c.description)) {
      descMap[c.name] = c.design?.bottom_text || c.description
    }
  })
  const items = []
  let total = 0
  for (const [name, count] of Object.entries(cardMap)) {
    total += count
    const item = [
      { text: `■ ${name}  ×${count}枚`, pt: 8.5, weight: 'bold', gapAfter: descMap[name] ? 0.5 : 2.5 },
    ]
    if (descMap[name]) {
      item.push({ text: stripMarkdown(descMap[name]), pt: 7, color: C.sub, indent: 3.5, gapAfter: 2.5 })
    }
    items.push(item)
  }
  if (items.length === 0) {
    items.push([{ text: 'カードがまだ登録されていません。', pt: 8, color: C.sub }])
  } else {
    items.push([{ text: `合計 ${total}枚`, pt: 9, weight: 'bold', color: C.navy, gapBefore: 2 }])
  }
  return items
}

function buildCardTypeItems(cards) {
  const seen = new Set()
  const unique = []
  cards.forEach((c) => {
    if (!seen.has(c.name)) { seen.add(c.name); unique.push(c) }
  })
  if (unique.length === 0) {
    return [[{ text: 'カードがまだ登録されていません。', pt: 8, color: C.sub }]]
  }
  return unique.map((card) => {
    const d = card.design || {}
    const item = [
      { text: card.name, pt: 8.5, weight: 'bold', icon: d.icon || '🃏', iconSize: 6, indent: 8.5, gapAfter: 0.5 },
    ]
    const desc = d.bottom_text || card.description
    if (desc) {
      item.push({ text: stripMarkdown(desc), pt: 7, color: C.sub, indent: 8.5, gapAfter: 3 })
    } else {
      item[0].gapAfter = 3
    }
    return item
  })
}

function buildWinConditionBlocks(rules) {
  const factions = (rules.factions || []).filter((f) => f.name || f.winCondition)
  if (factions.length === 0) {
    return [{ text: '勝利条件は設定されていません。', pt: 8, color: C.sub }]
  }
  const blocks = []
  factions.forEach((f, i) => {
    blocks.push({ text: `【${f.name || '陣営'}】`, pt: 8.5, weight: 'bold', color: C.navy, gapAfter: 0.5 })
    if (f.winCondition) {
      blocks.push({ text: stripMarkdown(f.winCondition), pt: 8, indent: 2, gapAfter: 2 })
    }
    if (i < factions.length - 1) {
      blocks.push({ sep: true, gapBefore: 1, gapAfter: 2.5 })
    }
  })
  return blocks
}

function buildSetupBlocks(rules) {
  const setupPhase = (rules.phases || []).find((p) =>
    /準備|セットアップ|setup/i.test(p.name || '')
  )
  if (setupPhase && setupPhase.content) {
    return [{ text: stripMarkdown(setupPhase.content), pt: 8, lh: 1.65 }]
  }
  return [
    '① カードをよくシャッフルする',
    '② 各プレイヤーに手札を配る',
    '③ 残りを山札として中央に置く',
    '④ 最初のプレイヤーを決める',
  ].map((step) => ({ text: step, pt: 8.5, gapAfter: 3 }))
}

const CIRCLE_NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮']

function buildFlowItems(rules) {
  const phases = (rules.phases || []).filter((p) =>
    (p.name || p.content) && !/準備|セットアップ|setup/i.test(p.name || '')
  )
  return phases.map((p, i) => {
    const num = CIRCLE_NUMS[i] || `${i + 1}.`
    const item = [
      { text: `${num} ${p.name || 'フェーズ'}`, pt: 8.5, weight: 'bold', gapAfter: 1 },
    ]
    if (p.content) {
      item.push({ text: stripMarkdown(p.content), pt: 7.5, indent: 2.5, gapAfter: 1 })
    }
    if (p.endCondition) {
      item.push({ text: `→ ${stripMarkdown(p.endCondition)}`, pt: 7, color: C.sub, indent: 2.5, gapAfter: 1 })
    }
    item.push({ sep: true, gapBefore: 1.5, gapAfter: 2.5 })
    return item
  })
}

// Custom section values are stored as { text } or { items: [] } objects
function customSectionText(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value.items)) {
    return value.items.filter((it) => it && it.trim()).map((it) => `・${it}`).join('\n')
  }
  return value.text || ''
}

function buildSpecialItems(rules) {
  const specials = [
    ...(rules.specialRules || [])
      .filter((r) => r.title || r.description)
      .map((r) => ({ title: r.title, desc: r.description })),
    ...((rules.sections || [])
      .filter((s) => s.type === 'custom')
      .map((s) => ({ title: s.title, desc: customSectionText(rules.customSections?.[s.id]) }))
      .filter((s) => s.title || s.desc)),
  ]
  return specials.map((sp) => {
    const item = [
      { text: `▶ ${sp.title || 'ルール'}`, pt: 8.5, weight: 'bold', color: C.navy, gapAfter: 1 },
    ]
    if (sp.desc) {
      item.push({ text: stripMarkdown(sp.desc), pt: 7.5, indent: 2.5, gapAfter: 3.5 })
    } else {
      item[0].gapAfter = 3.5
    }
    return item
  })
}

// ─── Fold guides ───
function drawFoldGuides(doc, sideLabel) {
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([2, 2], 0)
  ;[FACE_W, FACE_W * 2, FACE_W * 3].forEach((x) => {
    doc.line(x, 0, x, 210)
  })
  doc.line(0, FACE_H, 297, FACE_H)
  doc.setLineDashPattern([], 0)

  drawText(doc, `※ A4両面印刷 → 点線で折ってください（巻き折り4つ折り）｜${sideLabel}`, 2, 206.8, {
    pt: 5.5, color: '#999999', maxWidthMm: 110, lh: 1.1,
  })
}

// ─── Main export ───
export async function generateRulebook(state) {
  const { rules = {}, cards = [], genre } = state

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // pre-pack multi-face sections by measured content height
  const compFaces = packItems(buildComponentItems(cards), 2)
  const cardFaces = packItems(buildCardTypeItems(cards), 2)
  const flowItems = buildFlowItems(rules)
  const flowFaces = packItems(
    flowItems.length > 0
      ? flowItems
      : [[{ text: 'ゲームの流れは設定されていません。', pt: 8, color: C.sub }]],
    4
  )
  const specialItems = buildSpecialItems(rules)
  const specialFaces = packItems(
    specialItems.length > 0
      ? specialItems
      : [[{ text: '特別ルールはありません。', pt: 8, color: C.sub }]],
    3
  )

  const cont = (base, idx) => (idx === 0 ? base : `${base}（つづき）`)

  // face number → renderer (booklet reading order = face number)
  const faces = {
    1: (fx, fy) => renderCover(doc, fx, fy, rules, genre),
    2: (fx, fy) => renderContentFace(doc, fx, fy, '1. ゲームの概要', [
      { text: stripMarkdown(rules.theme) || 'このゲームの世界観をここに記載します。', pt: 8, lh: 1.7, gapAfter: 4 },
      { sep: true, gapBefore: 2, gapAfter: 3 },
      { text: `プレイ人数：${rules.players?.min || 2}〜${rules.players?.max || 6}人`, pt: 8, color: C.sub, gapAfter: 1.5 },
      { text: `プレイ時間：${rules.duration || '未設定'}`, pt: 8, color: C.sub },
    ], 2),
    3: (fx, fy) => renderContentFace(doc, fx, fy, cont('2. 内容物', 0), compFaces[0], 3),
    4: (fx, fy) => (compFaces[1].length
      ? renderContentFace(doc, fx, fy, cont('2. 内容物', 1), compFaces[1], 4)
      : renderMemoFace(doc, fx, fy, 4)),
    5: (fx, fy) => renderContentFace(doc, fx, fy, cont('3. カードの見方', 0), cardFaces[0], 5),
    6: (fx, fy) => (cardFaces[1].length
      ? renderContentFace(doc, fx, fy, cont('3. カードの見方', 1), cardFaces[1], 6)
      : renderMemoFace(doc, fx, fy, 6)),
    7: (fx, fy) => renderContentFace(doc, fx, fy, '4. ゲームの終了と勝利条件', buildWinConditionBlocks(rules), 7),
    8: (fx, fy) => renderContentFace(doc, fx, fy, '5. ゲームの準備', buildSetupBlocks(rules), 8),
    9: (fx, fy) => renderContentFace(doc, fx, fy, cont('6. ゲームの流れ', 0), flowFaces[0], 9),
    10: (fx, fy) => (flowFaces[1].length
      ? renderContentFace(doc, fx, fy, cont('6. ゲームの流れ', 1), flowFaces[1], 10)
      : renderMemoFace(doc, fx, fy, 10)),
    11: (fx, fy) => (flowFaces[2].length
      ? renderContentFace(doc, fx, fy, cont('6. ゲームの流れ', 2), flowFaces[2], 11)
      : renderMemoFace(doc, fx, fy, 11)),
    12: (fx, fy) => (flowFaces[3].length
      ? renderContentFace(doc, fx, fy, cont('6. ゲームの流れ', 3), flowFaces[3], 12)
      : renderMemoFace(doc, fx, fy, 12)),
    13: (fx, fy) => renderContentFace(doc, fx, fy, cont('7. 特別ルール・用語解説', 0), specialFaces[0], 13),
    14: (fx, fy) => (specialFaces[1].length
      ? renderContentFace(doc, fx, fy, cont('7. 特別ルール・用語解説', 1), specialFaces[1], 14)
      : renderMemoFace(doc, fx, fy, 14)),
    15: (fx, fy) => (specialFaces[2].length
      ? renderContentFace(doc, fx, fy, cont('7. 特別ルール・用語解説', 2), specialFaces[2], 15)
      : renderMemoFace(doc, fx, fy, 15)),
    16: (fx, fy) => renderBackCover(doc, fx, fy, rules),
  }

  // physical placement (16-face roll fold imposition)
  const PAGE1 = [[1, 0, 0], [2, FACE_W, 0], [5, FACE_W * 2, 0], [6, FACE_W * 3, 0],
    [3, 0, FACE_H], [4, FACE_W, FACE_H], [7, FACE_W * 2, FACE_H], [8, FACE_W * 3, FACE_H]]
  const PAGE2 = [[9, 0, 0], [10, FACE_W, 0], [13, FACE_W * 2, 0], [14, FACE_W * 3, 0],
    [11, 0, FACE_H], [12, FACE_W, FACE_H], [15, FACE_W * 2, FACE_H], [16, FACE_W * 3, FACE_H]]

  for (const [n, fx, fy] of PAGE1) faces[n](fx, fy)
  drawFoldGuides(doc, 'おもて面')

  doc.addPage()
  for (const [n, fx, fy] of PAGE2) faces[n](fx, fy)
  drawFoldGuides(doc, 'うら面')

  const title = rules?.gameTitle || 'rulebook'
  doc.save(`${title}_rulebook.pdf`)
}
