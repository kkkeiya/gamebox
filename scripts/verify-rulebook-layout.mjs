// Temporary layout verification harness (not shipped).
// Mocks canvas text metrics and intercepts jsPDF.addImage to check that
// no rendered text/emoji block crosses a face boundary.

function makeCanvas() {
  const canvas = { width: 300, height: 150 }
  const ctx = {
    font: '10px sans-serif',
    fillStyle: '#000',
    textBaseline: 'top',
    textAlign: 'left',
    measureText(s) {
      const px = parseFloat(ctx.font.match(/(\d+(\.\d+)?)px/)?.[1] || 10)
      let w = 0
      for (const ch of s) w += ch.codePointAt(0) > 0xff ? px : px * 0.55
      return { width: w }
    },
    fillText() {},
    clearRect() {},
  }
  canvas.getContext = () => ctx
  canvas.toDataURL = () => 'data:image/png;base64,x'
  return canvas
}
globalThis.document = { createElement: () => makeCanvas() }

const { jsPDF } = await import('jspdf')
const images = []
jsPDF.API.addImage = function (data, fmt, x, y, w, h) {
  const page = this.internal.getCurrentPageInfo().pageNumber
  images.push({ page, x, y, w, h })
  return this
}
jsPDF.API.save = function () { return this }

const { generateRulebook } = await import('../src/lib/generateRulebook.js')

const longText = 'プレイヤーは古代遺跡を探索する冒険者となり、互いに協力しながら仕掛けられた罠を回避し、隠された秘宝を集めていきます。ただし全員の中に裏切り者が紛れ込んでいるかもしれません。'

const mkPhase = (i) => ({
  id: `p${i}`,
  name: `フェーズ${i}：行動と判定の処理`,
  content: `手番プレイヤーは山札から2枚引き、手札から1枚を場に出します。場に出したカードの効果を解決し、隣のプレイヤーと交渉できます。${longText}`,
  endCondition: '全員が行動を終えたら次のフェーズへ進みます',
})

const cards = []
for (let t = 0; t < 8; t++) {
  cards.push({
    id: `c${t}`, name: `カードタイプ${t + 1}`, count: 6,
    description: `このカードは特殊な効果を持っています。使用すると${longText.slice(0, 60)}`,
    design: { icon: '🃏', bottom_text: `このカードは特殊な効果を持っています。番号${t + 1}の処理を行います。` },
  })
}

const state = {
  genre: 'coop',
  cards,
  rules: {
    gameTitle: '古代遺跡と裏切り者たちの最後の晩餐',
    players: { min: 3, max: 8 },
    duration: '約30〜45分',
    theme: longText + longText,
    factions: [
      { id: 'f1', name: '冒険者陣営', winCondition: '秘宝を3つ集めて遺跡から脱出すれば勝利。' + longText },
      { id: 'f2', name: '裏切り者陣営', winCondition: '冒険者の脱出を3回妨害すれば勝利します。' },
      { id: 'f3', name: '第三陣営', winCondition: '誰よりも先に出口に到達すれば単独勝利。' },
    ],
    phases: [
      { id: 'p0', name: '準備フェーズ', content: 'カードを全てシャッフルし、各プレイヤーに役職カードを1枚と手札5枚を配ります。残りは山札にします。', endCondition: '' },
      ...Array.from({ length: 7 }, (_, i) => mkPhase(i + 1)),
    ],
    specialRules: Array.from({ length: 6 }, (_, i) => ({
      id: `s${i}`, title: `特別ルール${i + 1}`, description: `この条件を満たした場合、${longText.slice(0, 70)}`,
    })),
    sections: [
      { id: 'cs1', type: 'custom', title: '用語解説' },
      { id: 'cs2', type: 'custom', title: '持ち物リスト' },
    ],
    // real app stores custom sections as { text } or { items: [] } objects
    customSections: {
      cs1: { text: '「探索」…山札からカードを引くこと。「交渉」…他プレイヤーとカードを交換すること。' },
      cs2: { items: ['筆記用具', 'トークン20個', 'タイマー（スマホ可）'] },
    },
  },
}

await generateRulebook(state)

const FACE_W = 74.25
const FACE_H = 105
let bad = 0
for (const im of images) {
  if (im.y > 205) continue // sheet-level fold instruction in bottom margin
  const e = 0.05
  const col1 = Math.floor((im.x + e) / FACE_W)
  const col2 = Math.floor((im.x + im.w - e) / FACE_W)
  const row1 = Math.floor((im.y + e) / FACE_H)
  const row2 = Math.floor((im.y + im.h - e) / FACE_H)
  const inPage = im.x >= -e && im.y >= -e && im.x + im.w <= 297 + e && im.y + im.h <= 210 + e
  if (col1 !== col2 || row1 !== row2 || !inPage) {
    bad += 1
    console.log('OVERFLOW:', JSON.stringify(im))
  }
}
console.log(`images drawn: ${images.length}, overflows: ${bad}`)

// Empty-content state (fresh project) should also work
images.length = 0
await generateRulebook({ genre: 'party', cards: [], rules: { gameTitle: '', players: { min: 2, max: 6 }, duration: '', theme: '', factions: [{ id: 'f1', name: '', winCondition: '' }], phases: [{ id: 'p1', name: '', content: '', endCondition: '' }], specialRules: [{ id: 's1', title: '', description: '' }], sections: [], customSections: {} } })
let bad2 = 0
for (const im of images) {
  if (im.y > 205) continue
  const e = 0.05
  if (Math.floor((im.x + e) / FACE_W) !== Math.floor((im.x + im.w - e) / FACE_W) ||
      Math.floor((im.y + e) / FACE_H) !== Math.floor((im.y + im.h - e) / FACE_H)) {
    bad2 += 1
    console.log('OVERFLOW(empty):', JSON.stringify(im))
  }
}
console.log(`empty-state images: ${images.length}, overflows: ${bad2}`)
