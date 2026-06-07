const CARD_UNIT_PRICE = 10
const BASE_FEE = 20000

export function calculatePrice(cards, cardSpec) {
  const totalCards = cards.reduce((sum, c) => sum + (c.count || 0), 0)
  const cardTotal = totalCards * CARD_UNIT_PRICE * cardSpec.sets
  const total = BASE_FEE + cardTotal
  return { baseFee: BASE_FEE, cardTotal, total, totalCards }
}
