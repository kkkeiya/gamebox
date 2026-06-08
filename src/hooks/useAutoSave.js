import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { projectStorage } from '../lib/projectStorage'

export function useAutoSave() {
  const store = useGameStore()
  const [saved, setSaved] = useState(false)
  const timerRef = useRef(null)
  const prevRef = useRef(null)

  useEffect(() => {
    if (!store.currentProjectId) return

    const snapshot = JSON.stringify({
      genre: store.genre,
      gameTitle: store.gameTitle,
      template: store.template,
      rules: store.rules,
      cards: store.cards,
      cardSpec: store.cardSpec,
      rulebook: store.rulebook,
    })

    if (prevRef.current === snapshot) return
    prevRef.current = snapshot

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const totalCards = store.cards.reduce((sum, c) => sum + (c.count || 0), 0)
      const hasContent = store.rules.gameTitle || store.cards.length > 0
      projectStorage.save({
        id: store.currentProjectId,
        genre: store.genre,
        gameTitle: store.gameTitle || store.rules.gameTitle || '',
        template: store.template,
        rules: store.rules,
        cards: store.cards,
        cardSpec: store.cardSpec,
        rulebook: store.rulebook,
        status: hasContent ? 'draft' : 'draft',
        totalCards,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 2000)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [store.genre, store.gameTitle, store.template, store.rules, store.cards, store.cardSpec, store.rulebook, store.currentProjectId])

  return saved
}
