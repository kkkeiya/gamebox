import { create } from 'zustand'

const DEFAULT_DESIGN = {
  bg_color: '#ffffff',
  border_color: '#0B1F5C',
  icon: '🃏',
  title_text: '',
  center_text: '',
  bottom_text: '',
  font_size: 'M',
  layout: 'title-top',
  image_url: '',
}

const DEFAULT_SECTIONS = [
  { id: 'basic', type: 'default', title: 'ゲームの基本情報', icon: '📋', deletable: false },
  { id: 'factions', type: 'default', title: 'ゲームの目的', icon: '🎯', deletable: false },
  { id: 'phases', type: 'default', title: 'ゲームの流れ', icon: '🔄', deletable: false },
  { id: 'special', type: 'default', title: '特殊ルール・例外', icon: '⚡', deletable: false },
]

const DEFAULT_RULES = {
  gameTitle: '',
  players: { min: 2, max: 6 },
  duration: '',
  theme: '',
  factions: [{ id: 'f1', name: '', winCondition: '' }],
  phases: [{ id: 'p1', name: '', content: '', endCondition: '' }],
  specialRules: [{ id: 's1', title: '', description: '' }],
  sections: [...DEFAULT_SECTIONS],
  customSections: {},
  completedSections: [],
  template_answers: {},
}

export const useGameStore = create((set) => ({
  genre: 'party',
  gameTitle: '',
  template: '',
  currentProjectId: null,
  rules: { ...DEFAULT_RULES },
  cards: [],
  cardSpec: {
    size: 'poker',
    surface: 'none',
    sets: 1,
    back_design: { style: 'simple', color: '#0B1F5C' },
  },
  rulebook: {
    include: true,
    pages: 4,
  },

  setGenre: (genre) => set({ genre }),
  setGameTitle: (gameTitle) => set({ gameTitle }),
  setTemplate: (template) => set({ template }),
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setRules: (rules) => set((state) => ({ rules: { ...state.rules, ...rules } })),
  setCards: (cards) => set({ cards }),
  addCard: (card) => set((state) => ({
    cards: [...state.cards, { ...card, id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, design: { ...DEFAULT_DESIGN, icon: card.emoji || '🃏', title_text: card.name, bottom_text: card.description || '' } }],
  })),
  removeCard: (index) => set((state) => ({ cards: state.cards.filter((_, i) => i !== index) })),
  updateCard: (index, data) => set((state) => ({
    cards: state.cards.map((c, i) => (i === index ? { ...c, ...data } : c)),
  })),
  updateCardDesign: (index, design) => set((state) => ({
    cards: state.cards.map((c, i) => (i === index ? { ...c, design: { ...c.design, ...design } } : c)),
  })),
  updateCardCount: (index, count) => set((state) => ({
    cards: state.cards.map((c, i) => (i === index ? { ...c, count: Math.max(1, count) } : c)),
  })),
  setCardSpec: (cardSpec) => set((state) => ({ cardSpec: { ...state.cardSpec, ...cardSpec } })),
  setRulebook: (rulebook) => set((state) => ({ rulebook: { ...state.rulebook, ...rulebook } })),
  loadProject: (project) => set({
    currentProjectId: project.id,
    genre: project.genre || 'party',
    gameTitle: project.gameTitle || '',
    template: project.template || '',
    rules: { ...DEFAULT_RULES, ...(project.rules || {}) },
    cards: project.cards || [],
    cardSpec: project.cardSpec || { size: 'poker', surface: 'none', sets: 1, back_design: { style: 'simple', color: '#0B1F5C' } },
    rulebook: project.rulebook || { include: true, pages: 4 },
  }),
  resetAll: () => set({
    genre: 'party',
    gameTitle: '',
    template: '',
    currentProjectId: null,
    rules: { ...DEFAULT_RULES },
    cards: [],
    cardSpec: { size: 'poker', surface: 'none', sets: 1, back_design: { style: 'simple', color: '#0B1F5C' } },
    rulebook: { include: true, pages: 4 },
  }),
}))
