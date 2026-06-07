import { create } from 'zustand'

export const useGameStore = create((set) => ({
  genre: 'party',
  gameTitle: '',
  rules: {},
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
  setRules: (rules) => set({ rules }),
  setCards: (cards) => set({ cards }),
  setCardSpec: (cardSpec) => set((state) => ({ cardSpec: { ...state.cardSpec, ...cardSpec } })),
  setRulebook: (rulebook) => set((state) => ({ rulebook: { ...state.rulebook, ...rulebook } })),
}))
