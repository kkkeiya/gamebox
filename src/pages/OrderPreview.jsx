import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { calculatePrice } from '../lib/pricing'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const GENRE_LABELS = { party: 'パーティーゲーム', coop: '協力ゲーム' }
const SIZE_LABELS = { poker: 'ポーカー (63×88mm)', bridge: 'ブリッジ (58×89mm)', mini: 'ミニ (44×63mm)' }
const SURFACE_LABELS = { none: 'なし', gloss: '光沢PP', matte: 'マットPP' }

export default function OrderPreview() {
  const navigate = useNavigate()
  const { genre, gameTitle, rules, cards, cardSpec, rulebook, setCardSpec, setRulebook } = useGameStore()
  const pricing = calculatePrice(cards, cardSpec, rulebook)
  const scrollRef = useRef(null)

  const fmt = (n) => n.toLocaleString('ja-JP')

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-black text-navy">見積もり確認</h1>
      <p className="mt-1 text-navy/50 text-sm">内容を確認して、発注データを出力しましょう</p>

      {/* ─── Game Summary ─── */}
      <Card className="mt-8 divide-y divide-navy/10">
        <Row label="ゲームタイトル" value={gameTitle || '未設定'} />
        <Row label="ジャンル" value={GENRE_LABELS[genre] || genre} />
        <Row label="プレイ人数" value={typeof rules.players === 'number' ? `${rules.players}人` : `${rules.players?.min || 2}〜${rules.players?.max || 6}人`} />
        <Row label="プレイ時間" value={rules.duration || '未設定'} />
        <Row label="カード種類" value={`${cards.length}種`} />
        <Row label="カード合計" value={`${pricing.totalCards}枚`} />
        <Row label="カードサイズ" value={SIZE_LABELS[cardSpec.size]} />
        <Row label="表面加工" value={SURFACE_LABELS[cardSpec.surface]} />
      </Card>

      {/* ─── Card Preview Scroll ─── */}
      {cards.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-3">カード一覧プレビュー</h2>
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none">
            {cards.map((card, i) => {
              const d = card.design || {}
              return (
                <div key={card.id || i} className="shrink-0 rounded-xl overflow-hidden flex flex-col items-center justify-between"
                  style={{ width: 80, height: 112, background: d.bg_color || '#fff', border: `2px solid ${d.border_color || '#0B1F5C'}` }}>
                  <div className="w-full text-center py-1 px-1" style={{ background: 'rgba(240,244,255,0.5)' }}>
                    <p className="text-[7px] font-black truncate" style={{ color: d.border_color || '#0B1F5C' }}>{d.title_text || card.name}</p>
                  </div>
                  <span className="text-xl">{d.icon || card.emoji || '🃏'}</span>
                  <div className="w-full text-center py-1 px-1" style={{ background: 'rgba(240,244,255,0.5)' }}>
                    <p className="text-[6px] text-navy/40 truncate">×{card.count}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Options ─── */}
      <div className="mt-6 space-y-3">
        <Card className="px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-navy">ルールブックを含める</span>
              <span className="block text-xs text-navy/40 mt-0.5">A4・4つ折り8面 +¥5,000</span>
            </div>
            <button type="button" onClick={() => setRulebook({ include: !rulebook.include })}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${rulebook.include ? 'bg-accent' : 'bg-navy/20'}`}>
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${rulebook.include ? 'left-5.5' : 'left-0.5'}`} />
            </button>
          </div>
          {rulebook.include && (
            <button type="button" onClick={() => navigate('/export')}
              className="mt-3 w-full text-xs font-bold text-navy bg-navy/5 px-3 py-2 rounded-full hover:bg-navy/10 cursor-pointer transition-colors text-center">
              📖 ルールブックプレビュー →
            </button>
          )}
        </Card>

        <Card className="flex items-center justify-between px-5 py-3.5">
          <span className="text-sm font-bold text-navy">セット数</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCardSpec({ sets: Math.max(1, cardSpec.sets - 1) })}
              className="w-8 h-8 rounded-full bg-navy/10 text-navy font-bold flex items-center justify-center cursor-pointer hover:bg-navy/20">−</button>
            <span className="w-8 text-center font-bold text-navy">{cardSpec.sets}</span>
            <button type="button" onClick={() => setCardSpec({ sets: Math.min(10, cardSpec.sets + 1) })}
              className="w-8 h-8 rounded-full bg-navy/10 text-navy font-bold flex items-center justify-center cursor-pointer hover:bg-navy/20">+</button>
          </div>
        </Card>
      </div>

      {/* ─── Pricing ─── */}
      <div className="mt-6 bg-navy rounded-2xl p-6 text-white space-y-2.5">
        <PriceRow label="基本料金" value={`¥${fmt(pricing.baseFee)}`} />
        <PriceRow label={`カード印刷（${pricing.totalCards}枚 × @${pricing.unitPrice}円 × ${cardSpec.sets}セット）`} value={`¥${fmt(pricing.cardTotal)}`} />
        {rulebook.include && <PriceRow label="ルールブック" value={`¥${fmt(pricing.rulebookFee)}`} />}
        <div className="border-t border-white/20 pt-2.5 space-y-1">
          <PriceRow label="小計（税別）" value={`¥${fmt(pricing.subtotal)}`} bold />
          <PriceRow label="消費税（10%）" value={`¥${fmt(pricing.tax)}`} />
          <div className="flex justify-between text-lg font-extrabold pt-1">
            <span>税込合計</span>
            <span className="text-accent">¥{fmt(pricing.total)}</span>
          </div>
        </div>
      </div>

      <Button onClick={() => navigate('/export')} className="mt-10 w-full">
        発注データを出力する →
      </Button>
    </PageShell>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between px-5 py-3.5">
      <span className="text-sm text-navy/50">{label}</span>
      <span className="text-sm font-bold text-navy">{value}</span>
    </div>
  )
}

function PriceRow({ label, value, bold }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? 'font-bold' : 'opacity-70'}>{label}</span>
      <span className={bold ? 'font-bold' : ''}>{value}</span>
    </div>
  )
}
