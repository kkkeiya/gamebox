import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import PageShell from '../components/layout/PageShell'

const CARD_W = 180
const CARD_H = 252

export default function CardEditor() {
  const navigate = useNavigate()
  const { cards, cardSpec, updateCard } = useGameStore()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const current = cards[selectedIndex]
  if (!current) {
    return (
      <PageShell>
        <p className="text-navy/50">カードがありません。前のページで追加してください。</p>
      </PageShell>
    )
  }

  const ratio = cardSpec.size === 'poker' ? 63 / 88 : 58 / 89

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-extrabold text-navy">カードデザイン</h1>
      <p className="mt-1 text-navy/50 text-sm">各カードの見た目を編集します</p>

      <div className="mt-8 flex flex-col md:flex-row gap-6">
        {/* Left: Card List */}
        <div className="md:w-48 shrink-0 space-y-1">
          <h2 className="text-xs font-bold text-navy/50 mb-2">カード一覧</h2>
          {cards.map((card, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`w-full text-left rounded-xl px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
                i === selectedIndex
                  ? 'bg-navy text-white'
                  : 'bg-white text-navy/70 hover:bg-navy/5 border border-navy/10'
              }`}
            >
              {card.name}
              <span className="opacity-50 ml-1">×{card.count}</span>
            </button>
          ))}
        </div>

        {/* Right: Editor + Preview */}
        <div className="flex-1 space-y-6">
          {/* Preview Card */}
          <div className="flex justify-center">
            <div
              className="bg-white rounded-2xl border-2 border-navy/20 shadow-lg flex flex-col items-center justify-between overflow-hidden"
              style={{ width: CARD_W, height: CARD_H }}
            >
              {/* Title */}
              <div className="w-full bg-navy/5 px-3 py-2">
                <p className="text-xs font-bold text-navy text-center truncate">
                  {current.name}
                </p>
              </div>
              {/* Emoji / Image */}
              <div className="flex-1 flex items-center justify-center">
                <span className="text-5xl">{current.emoji || '🃏'}</span>
              </div>
              {/* Text */}
              <div className="w-full bg-navy/5 px-3 py-2">
                <p className="text-[10px] text-navy/60 text-center line-clamp-2">
                  {current.text || current.description || '説明テキスト'}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">絵文字</label>
              <input
                type="text"
                value={current.emoji || ''}
                onChange={(e) => updateCard(selectedIndex, { emoji: e.target.value })}
                placeholder="🎭"
                className="w-full rounded-xl border border-navy/20 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">テキスト</label>
              <textarea
                value={current.text || ''}
                onChange={(e) => updateCard(selectedIndex, { text: e.target.value })}
                placeholder="カードに表示するテキスト"
                rows={3}
                className="w-full rounded-xl border border-navy/20 bg-white px-4 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/order')}
        className="mt-10 w-full rounded-xl bg-navy text-white font-bold py-3.5 text-base hover:bg-navy/90 transition-colors cursor-pointer"
      >
        次へ →
      </button>
    </PageShell>
  )
}
