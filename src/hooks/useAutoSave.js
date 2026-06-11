import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { projectStorage } from '../lib/projectStorage'

export function useAutoSave() {
  const store = useGameStore()
  const [saved, setSaved] = useState(false)
  const timerRef = useRef(null)
  const prevRef = useRef(null)

  useEffect(() => {
    const r = store.rules
    const hasContent = Boolean(
      r.gameTitle || r.theme || store.cards.length > 0 ||
      (r.factions || []).some((f) => f.name || f.winCondition) ||
      (r.phases || []).some((p) => p.name || p.content) ||
      (r.specialRules || []).some((s) => s.title || s.description)
    )

    // No project yet (e.g. entered from Home): create one as soon as
    // the user has actually written something, so nothing is ever lost.
    if (!store.currentProjectId && !hasContent) return

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
      const project = projectStorage.save({
        id: store.currentProjectId || undefined,
        genre: store.genre,
        gameTitle: store.gameTitle || store.rules.gameTitle || '',
        template: store.template,
        rules: store.rules,
        cards: store.cards,
        cardSpec: store.cardSpec,
        rulebook: store.rulebook,
        status: 'draft',
        totalCards,
      })
      if (!store.currentProjectId && project?.id) {
        useGameStore.getState().setCurrentProjectId(project.id)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 2000)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [store.genre, store.gameTitle, store.template, store.rules, store.cards, store.cardSpec, store.rulebook, store.currentProjectId])

  return saved
}
