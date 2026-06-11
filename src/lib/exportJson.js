import { calculatePrice } from './pricing'

const SIZE_MM = {
  poker: { w: 63, h: 88 },
  bridge: { w: 58, h: 89 },
  mini: { w: 44, h: 63 },
}

const TEMPLATE_LABELS = {
  werewolf: '正体隠匿',
  word: 'ワード系',
  coop: '協力系',
  mystery: '推理系',
  original: 'オリジナル',
}

// Custom section values are stored as { text } or { items: [] } objects
function customSectionText(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value.items)) return value.items.filter((it) => it && it.trim()).join('\n')
  return value.text || ''
}

export function exportGameData(state) {
  const pricing = calculatePrice(state.cards, state.cardSpec, state.rulebook)
  return {
    order: {
      created_at: new Date().toISOString(),
      game_title: state.gameTitle || state.rules.gameTitle || '',
      genre: state.genre,
      template: TEMPLATE_LABELS[state.template] || state.template || 'オリジナル',
    },
    rules: {
      players: state.rules.players,
      duration: state.rules.duration,
      theme: state.rules.theme || '',
      factions: (state.rules.factions || [])
        .filter((f) => f.name || f.winCondition)
        .map((f) => ({ name: f.name, win_condition: f.winCondition })),
      phases: (state.rules.phases || [])
        .filter((p) => p.name || p.content)
        .map((p) => ({ name: p.name, content: p.content, end_condition: p.endCondition })),
      special_rules: (state.rules.specialRules || [])
        .filter((r) => r.title || r.description)
        .map((r) => ({ title: r.title, description: r.description })),
      custom_sections: (state.rules.sections || [])
        .filter((s) => s.type === 'custom')
        .map((s) => ({ title: s.title, content: customSectionText(state.rules.customSections?.[s.id]) }))
        .filter((s) => s.title || s.content),
      template_answers: state.rules.template_answers || {},
    },
    card_spec: {
      size: state.cardSpec.size,
      size_mm: SIZE_MM[state.cardSpec.size] || SIZE_MM.poker,
      thickness: 'standard',
      surface: state.cardSpec.surface,
      sets: state.cardSpec.sets,
    },
    cards: state.cards.map((c) => ({
      id: c.id || '',
      type: c.name,
      quantity: c.count,
      design: c.design || {},
    })),
    rulebook: {
      include: state.rulebook.include,
      format: 'A4両面・巻き折り16面',
      faces: 16,
    },
    pricing: {
      base_fee: pricing.baseFee,
      card_unit_price: pricing.unitPrice,
      card_total: pricing.cardTotal,
      rulebook_fee: pricing.rulebookFee,
      sets: pricing.sets,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
    },
    print_partner: 'mnd',
  }
}
