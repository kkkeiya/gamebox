import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

/* ───── Template suggestions ───── */
function getSuggestedCards(template, players, templateAnswers) {
  switch (template) {
    case 'werewolf': {
      const villains = templateAnswers?.villains || 2
      const roles = templateAnswers?.roles || []
      const cards = [
        { name: '人狼', count: villains, emoji: '🐺', description: '毎晩1人を襲撃できる' },
        { name: '市民', count: Math.max(1, players - villains - roles.length), emoji: '👤', description: '特殊能力なし・議論で人狼を見つける' },
      ]
      if (roles.includes('占師')) cards.push({ name: '占師', count: 1, emoji: '🔮', description: '毎晩1人の正体を確認できる' })
      if (roles.includes('騎士')) cards.push({ name: '騎士', count: 1, emoji: '🛡️', description: '毎晩1人を人狼の襲撃から守れる' })
      if (roles.includes('霊媒師')) cards.push({ name: '霊媒師', count: 1, emoji: '👻', description: '処刑された人の正体がわかる' })
      return cards
    }
    case 'word':
      return [
        { name: 'お題カード', count: 20, emoji: '💬', description: '回答者に出すお題' },
        { name: 'ヒントカード', count: 10, emoji: '💡', description: 'ヒントを出すときに使う' },
      ]
    case 'coop':
      return [
        { name: 'ミッションカード', count: 5, emoji: '🎯', description: 'クリアすべきミッション' },
        { name: 'アイテムカード', count: 10, emoji: '🔑', description: 'ミッションに使うアイテム' },
        { name: 'イベントカード', count: 5, emoji: '⚡', description: 'ランダムで発生するイベント' },
      ]
    case 'mystery':
      return [
        { name: '証拠カード', count: 8, emoji: '🔍', description: '事件の手がかり' },
        { name: '容疑者カード', count: 6, emoji: '🕵️', description: '容疑者の情報' },
        { name: 'アリバイカード', count: 6, emoji: '📋', description: '容疑者のアリバイ' },
      ]
    default: return []
  }
}

const sizeOptions = [
  { key: 'poker', label: 'ポーカー', sub: '63×88mm', badge: 'おすすめ' },
  { key: 'bridge', label: 'ブリッジ', sub: '58×89mm', badge: '' },
  { key: 'mini', label: 'ミニ', sub: '44×63mm', badge: '' },
]

const surfaceOptions = [
  { key: 'none', label: 'なし', desc: 'さらっとした手触り', extra: '' },
  { key: 'gloss', label: '光沢PP', desc: 'ツヤあり・鮮やか', extra: '+2円/枚' },
  { key: 'matte', label: 'マットPP', desc: '落ち着いた質感', extra: '+3円/枚' },
]

const inputClass = 'w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors'

export default function CardBuilder() {
  const navigate = useNavigate()
  const { cards, cardSpec, template, rules, addCard, removeCard, updateCardCount, setCardSpec } = useGameStore()
  const [name, setName] = useState('')
  const [count, setCount] = useState(1)
  const [description, setDescription] = useState('')
  const suggestedRef = useRef(false)

  // Auto-suggest cards from template on first visit
  useEffect(() => {
    if (cards.length === 0 && template && !suggestedRef.current) {
      const players = typeof rules.players === 'number' ? rules.players : (rules.players?.max || 6)
      const suggestions = getSuggestedCards(template, players, rules.template_answers)
      if (suggestions.length > 0) {
        suggestions.forEach((c) => addCard({ ...c, text: '' }))
        suggestedRef.current = true
      }
    }
  }, [template, cards.length, rules.players, rules.template_answers, addCard])

  const totalCards = cards.reduce((sum, c) => sum + (c.count || 0), 0)

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

      {/* Card List */}
      {cards.length > 0 && (
        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-navy">カード一覧（{cards.length}種）</h2>
            <span className="text-xs font-bold text-accent-warm bg-accent/30 px-3 py-1 rounded-full">
              合計：{totalCards}枚
            </span>
          </div>
          {cards.map((card, i) => (
            <Card key={card.id || i} className="flex items-center gap-3 px-4 py-3">
              <span className="text-2xl shrink-0">{card.design?.icon || card.emoji || '🃏'}</span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-navy text-sm">{card.name}</span>
                {card.description && <p className="text-xs text-navy/40 mt-0.5 truncate">{card.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => updateCardCount(i, card.count - 1)} className="w-7 h-7 rounded-full bg-navy/10 text-navy font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-navy/20">−</button>
                <span className="w-8 text-center text-sm font-bold text-navy">{card.count}</span>
                <button type="button" onClick={() => updateCardCount(i, card.count + 1)} className="w-7 h-7 rounded-full bg-navy/10 text-navy font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-navy/20">+</button>
              </div>
              <button type="button" onClick={() => removeCard(i)} className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer ml-2 shrink-0">削除</button>
            </Card>
          ))}
        </div>
      )}

      {/* Add Card */}
      <Card className="mt-6 p-5">
        <h2 className="text-sm font-black text-navy mb-3">＋ 新しいカード種別を追加</h2>
        <div className="space-y-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="種別名（例：役職カード）" className={inputClass} />
          <div className="flex gap-3">
            <div className="w-20">
              <label className="block text-xs font-bold text-navy/60 mb-1">枚数</label>
              <input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value)))} className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-navy/60 mb-1">説明</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="カードの役割など" className={inputClass} />
            </div>
          </div>
          <Button variant="secondary" onClick={handleAdd} className="w-full py-2.5 text-sm">追加</Button>
        </div>
      </Card>

      {/* Card Spec */}
      <div className="mt-10 space-y-6">
        <div>
          <h2 className="text-sm font-black text-navy mb-3">カードサイズ</h2>
          <div className="grid grid-cols-3 gap-2">
            {sizeOptions.map((s) => (
              <button key={s.key} type="button" onClick={() => setCardSpec({ size: s.key })}
                className={`relative rounded-2xl py-4 text-sm font-bold transition-all cursor-pointer ${cardSpec.size === s.key ? 'bg-navy text-white' : 'bg-white border-2 border-step-border text-navy/60 hover:border-navy/30'}`}>
                {s.badge && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-navy text-[10px] font-bold px-2 py-0.5 rounded-full">★{s.badge}</span>}
                {s.label}
                <span className="block text-xs font-normal opacity-70 mt-0.5">{s.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black text-navy mb-3">表面加工</h2>
          <div className="space-y-2">
            {surfaceOptions.map((s) => (
              <button key={s.key} type="button" onClick={() => setCardSpec({ surface: s.key })}
                className={`w-full text-left rounded-2xl px-4 py-3 transition-all cursor-pointer flex items-center justify-between ${cardSpec.surface === s.key ? 'bg-navy text-white' : 'bg-white border-2 border-step-border text-navy hover:border-navy/30'}`}>
                <div>
                  <span className="font-bold text-sm">{s.label}</span>
                  <span className={`block text-xs mt-0.5 ${cardSpec.surface === s.key ? 'text-white/60' : 'text-navy/40'}`}>{s.desc}</span>
                </div>
                {s.extra && <span className={`text-xs font-bold ${cardSpec.surface === s.key ? 'text-accent' : 'text-accent-warm'}`}>{s.extra}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={() => navigate('/cards/edit')} disabled={cards.length === 0} className="mt-10 w-full">
        次へ →
      </Button>
    </PageShell>
  )
}
