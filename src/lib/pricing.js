const BASE_FEE = 20000
const RULEBOOK_FEE = 5000

const CARD_BASE_PRICE = { poker: 10, bridge: 10, mini: 6 }
const SURFACE_SURCHARGE = { none: 0, gloss_pp: 2, matte_pp: 3, gloss: 2, matte: 3 }

export function calculatePrice(cards, cardSpec, rulebook) {
  const totalCards = cards.reduce((sum, c) => sum + (c.count || 0), 0)
  const basePrice = CARD_BASE_PRICE[cardSpec.size] || 10
  const surcharge = SURFACE_SURCHARGE[cardSpec.surface] || 0
  const unitPrice = basePrice + surcharge
  const cardTotal = totalCards * unitPrice * cardSpec.sets
  const rulebookFee = rulebook?.include ? RULEBOOK_FEE : 0
  const subtotal = BASE_FEE + cardTotal + rulebookFee
  const tax = Math.floor(subtotal * 0.1)
  const total = subtotal + tax

  return { baseFee: BASE_FEE, unitPrice, cardTotal, rulebookFee, totalCards, sets: cardSpec.sets, subtotal, tax, total }
}
