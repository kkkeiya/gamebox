import { calculatePrice } from './pricing'

const SIZE_MM = {
  poker: { w: 63, h: 88 },
  bridge: { w: 58, h: 89 },
}

export function exportGameData(state) {
  const pricing = calculatePrice(state.cards, state.cardSpec)
  return {
    order: {
      created_at: new Date().toISOString(),
      game_title: state.gameTitle,
      genre: state.genre,
    },
    card_spec: {
      size: state.cardSpec.size,
      size_mm: SIZE_MM[state.cardSpec.size],
      surface: state.cardSpec.surface,
      sets: state.cardSpec.sets,
    },
    cards: state.cards,
    rulebook: state.rulebook,
    pricing: {
      base_fee: pricing.baseFee,
      card_total: pricing.cardTotal,
      total: pricing.total,
    },
    print_partner: 'mnd',
  }
}
