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

export function exportGameData(state) {
  const pricing = calculatePrice(state.cards, state.cardSpec, state.rulebook)
  return {
    order: {
      created_at: new Date().toISOString(),
      game_title: state.gameTitle,
      genre: state.genre,
      template: TEMPLATE_LABELS[state.template] || state.template || 'オリジナル',
    },
    rules: {
      players: state.rules.players,
      duration: state.rules.duration,
      objective: state.rules.objective,
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
      pages: state.rulebook.pages,
      size: 'A5',
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
