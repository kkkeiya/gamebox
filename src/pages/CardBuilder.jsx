import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const sizeOptions = [
  { key: 'poker', label: 'ポーカー', sub: '63×88mm' },
  { key: 'bridge', label: 'ブリッジ', sub: '58×89mm' },
]

const surfaceOptions = [
  { key: 'none', label: 'なし' },
  { key: 'gloss', label: '光沢PP' },
  { key: 'matte', label: 'マットPP' },
]

const inputClass =
  'w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors'

export default function CardBuilder() {
  const navigate = useNavigate()
  const { cards, cardSpec, addCard, removeCard, setCardSpec } = useGameStore()
  const [name, setName] = useState('')
  const [count, setCount] = useState(1)
  const [description, setDescription] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    addCard({ name: name.trim(), count, description: description.trim(), emoji: '🃏', text: '' })
    setName('')
    setCount(1)
    setDescription('')
  }

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-black text-navy">カード構成</h1>
      <p className="mt-1 text-navy/50 text-sm">カードの種別と仕様を設定します</p>

      {/* Add Card Form */}
      <Card className="mt-8 p-5">
        <h2 className="text-sm font-black text-navy mb-3">カード種別を追加</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="種別名（例：役職カード）"
            className={inputClass}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-navy/60 mb-1">枚数</label>
              <input
                type="number"
                min={1}
                max={200}
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
                className={inputClass}
              />
            </div>
            <div className="flex-[2]">
              <label className="block text-xs font-bold text-navy/60 mb-1">説明</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="カードの役割など"
                className={inputClass}
              />
            </div>
          </div>
          <Button variant="secondary" onClick={handleAdd} className="w-full py-2.5 text-sm">
            ＋ 追加
          </Button>
        </div>
      </Card>

      {/* Card List */}
      {cards.length > 0 && (
        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-black text-navy">追加済みカード（{cards.length}種）</h2>
          {cards.map((card, i) => (
            <Card key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="font-bold text-navy text-sm">{card.name}</span>
                <span className="ml-2 text-navy/50 text-xs">×{card.count}</span>
                {card.description && (
                  <p className="text-xs text-navy/40 mt-0.5">{card.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeCard(i)}
                className="text-red-400 hover:text-red-600 text-sm font-bold cursor-pointer"
              >
                削除
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Card Spec */}
      <div className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-black text-navy mb-2">カードサイズ</label>
          <div className="grid grid-cols-2 gap-2">
            {sizeOptions.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setCardSpec({ size: s.key })}
                className={`rounded-full py-3 text-sm font-bold transition-all cursor-pointer ${
                  cardSpec.size === s.key
                    ? 'bg-navy text-white'
                    : 'bg-white border-2 border-blue-200 text-navy/60 hover:border-navy/30'
                }`}
              >
                {s.label}
                <span className="block text-xs font-normal opacity-70">{s.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-black text-navy mb-2">表面加工</label>
          <div className="grid grid-cols-3 gap-2">
            {surfaceOptions.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setCardSpec({ surface: s.key })}
                className={`rounded-full py-3 text-sm font-bold transition-all cursor-pointer ${
                  cardSpec.surface === s.key
                    ? 'bg-navy text-white'
                    : 'bg-white border-2 border-blue-200 text-navy/60 hover:border-navy/30'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={() => navigate('/cards/edit')}
        disabled={cards.length === 0}
        className="mt-10 w-full"
      >
        次へ →
      </Button>
    </PageShell>
  )
}
