import { create } from 'zustand'

export const useGameStore = create((set) => ({
  genre: 'party',
  gameTitle: '',
  rules: {
    players: 4,
    playtime: 15,
    winCondition: '',
  },
  cards: [],
  cardSpec: {
    size: 'poker',
    surface: 'none',
    sets: 1,
  },
  rulebook: {
    include: true,
    pages: 4,
  },

  setGenre: (genre) => set({ genre }),
  setGameTitle: (gameTitle) => set({ gameTitle }),
  setRules: (rules) => set((state) => ({ rules: { ...state.rules, ...rules } })),
  setCards: (cards) => set({ cards }),
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  removeCard: (index) => set((state) => ({ cards: state.cards.filter((_, i) => i !== index) })),
  updateCard: (index, data) => set((state) => ({
    cards: state.cards.map((c, i) => (i === index ? { ...c, ...data } : c)),
  })),
  setCardSpec: (cardSpec) => set((state) => ({ cardSpec: { ...state.cardSpec, ...cardSpec } })),
  setRulebook: (rulebook) => set((state) => ({ rulebook: { ...state.rulebook, ...rulebook } })),
  resetAll: () => set({
    genre: 'party',
    gameTitle: '',
    rules: { players: 4, playtime: 15, winCondition: '' },
    cards: [],
    cardSpec: { size: 'poker', surface: 'none', sets: 1 },
    rulebook: { include: true, pages: 4 },
  }),
}))
