import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { calculatePrice } from '../lib/pricing'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const GENRE_LABELS = { party: 'パーティーゲーム', coop: '協力ゲーム' }
const SIZE_LABELS = { poker: 'ポーカー (63×88mm)', bridge: 'ブリッジ (58×89mm)' }
const SURFACE_LABELS = { none: 'なし', gloss: '光沢PP', matte: 'マットPP' }

export default function OrderPreview() {
  const navigate = useNavigate()
  const { genre, gameTitle, rules, cards, cardSpec, rulebook, setCardSpec, setRulebook } =
    useGameStore()
  const pricing = calculatePrice(cards, cardSpec)

  const fmt = (n) => n.toLocaleString('ja-JP')

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-black text-navy">見積もり確認</h1>
      <p className="mt-1 text-navy/50 text-sm">内容を確認して、発注データを出力しましょう</p>

      {/* Summary */}
      <Card className="mt-8 divide-y divide-navy/10">
        <Row label="ジャンル" value={GENRE_LABELS[genre] || genre} />
        <Row label="タイトル" value={gameTitle || '未設定'} />
        <Row label="プレイ人数" value={`${rules.players}人`} />
        <Row label="プレイ時間" value={`${rules.playtime}分`} />
        <Row label="カード種類" value={`${cards.length}種`} />
        <Row label="カード合計枚数" value={`${pricing.totalCards}枚`} />
        <Row label="カードサイズ" value={SIZE_LABELS[cardSpec.size]} />
        <Row label="表面加工" value={SURFACE_LABELS[cardSpec.surface]} />
      </Card>

      {/* Options */}
      <div className="mt-6 space-y-3">
        <Card className="flex items-center justify-between px-5 py-3.5">
          <span className="text-sm font-bold text-navy">ルールブックを含める</span>
          <button
            type="button"
            onClick={() => setRulebook({ include: !rulebook.include })}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
              rulebook.include ? 'bg-accent' : 'bg-navy/20'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                rulebook.include ? 'left-5.5' : 'left-0.5'
              }`}
            />
          </button>
        </Card>

        <Card className="flex items-center justify-between px-5 py-3.5">
          <span className="text-sm font-bold text-navy">セット数</span>
          <select
            value={cardSpec.sets}
            onChange={(e) => setCardSpec({ sets: Number(e.target.value) })}
            className="rounded-full border-2 border-blue-200 px-4 py-1.5 text-sm text-navy font-bold focus:outline-none focus:border-navy transition-colors"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}セット
              </option>
            ))}
          </select>
        </Card>
      </div>

      {/* Pricing */}
      <div className="mt-6 bg-navy rounded-2xl p-6 text-white space-y-3">
        <div className="flex justify-between text-sm">
          <span className="opacity-70">基本料金</span>
          <span className="font-bold">¥{fmt(pricing.baseFee)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="opacity-70">
            カード（{pricing.totalCards}枚 × {cardSpec.sets}セット）
          </span>
          <span className="font-bold">¥{fmt(pricing.cardTotal)}</span>
        </div>
        <div className="border-t border-white/20 pt-3 flex justify-between text-lg font-extrabold">
          <span>合計（税別）</span>
          <span className="text-accent">¥{fmt(pricing.total)}</span>
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
