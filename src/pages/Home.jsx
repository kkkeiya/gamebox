import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

/* ───── wave SVG helpers ───── */
const WaveTop = ({ fill = '#0B1F5C', bg = '#F0F4FF' }) => (
  <svg viewBox="0 0 1440 80" className="block w-full -mb-px" preserveAspectRatio="none">
    <rect width="1440" height="80" fill={bg} />
    <path d="M0,40 C360,100 1080,0 1440,50 L1440,80 L0,80Z" fill={fill} />
  </svg>
)
const WaveBottom = ({ fill = '#0B1F5C', bg = '#F0F4FF' }) => (
  <svg viewBox="0 0 1440 80" className="block w-full -mt-px" preserveAspectRatio="none">
    <path d="M0,30 C360,-20 1080,70 1440,20 L1440,0 L0,0Z" fill={fill} />
    <rect y="30" width="1440" height="50" fill={bg} />
  </svg>
)

/* ───── data ───── */
const NAV_LINKS = [
  { label: '作り方', href: '#how' },
  { label: 'ジャンル', href: '#genres' },
  { label: '料金', href: '#pricing' },
]

const STEPS = [
  { n: '01', emoji: '🎮', title: 'ジャンルを選ぶ', desc: 'パーティー系・協力系など、つくりたいゲームの方向性を選びます。' },
  { n: '02', emoji: '📝', title: 'ルールを決める', desc: 'プレイ人数・時間・勝利条件など、基本ルールを設定します。' },
  { n: '03', emoji: '🃏', title: 'カードを作る', desc: 'カード種別を追加して、絵文字やテキストでデザインします。' },
  { n: '04', emoji: '👀', title: 'プレビューで確認する', desc: '見積もり金額と仕上がりイメージを確認します。' },
  { n: '05', emoji: '📦', title: '発注して、受け取る', desc: '発注データを出力。2〜3週間で本物のカードが届きます。' },
]

const GENRES = [
  { key: 'party', emoji: '🎭', title: 'パーティーゲーム', desc: '正体隠匿・ブラフ・大喜利など、盛り上がるゲームに', cardClass: 'bg-navy text-white' },
  { key: 'coop', emoji: '🤝', title: '協力ゲーム', desc: '全員で協力してミッション達成を目指すゲームに', cardClass: 'bg-accent text-navy' },
]

const PLANS = [
  { name: 'お試し', price: '無料', sub: '制作・プレビューまで', features: ['ルール設計', 'カードデザイン', 'JSON出力'], cta: 'つくってみる', highlighted: false },
  { name: 'テスト発注', price: '¥4,800〜', sub: '1セット・送料込み', features: ['お試しの全機能', 'テスト印刷1セット', '自宅にお届け'], cta: '発注してみる', highlighted: true },
  { name: 'まとめ発注', price: '要相談', sub: '10セット以上〜', features: ['テスト発注の全機能', 'ボリューム割引', '商用利用OK'], cta: 'お問い合わせ', highlighted: false },
]

const FAQS = [
  { q: 'デザインの知識がなくても作れますか？', a: 'はい、絵文字とテキストだけでカードをデザインできます。テンプレートに沿って入力するだけなので、デザインツールの経験は不要です。' },
  { q: 'どのくらいで届きますか？', a: '発注データ出力後、印刷・配送まで通常2〜3週間程度です。繁忙期はもう少しかかる場合があります。' },
  { q: '発注後にキャンセルできますか？', a: '印刷開始前であればキャンセル可能です。印刷開始後のキャンセルは承りかねますので、プレビューでしっかり確認してから発注してください。' },
  { q: '商用利用はできますか？', a: 'はい、作成したゲームの著作権はあなたに帰属します。販売・イベント配布など自由にお使いいただけます。' },
]

const MARQUEE_TEXT = 'ルール設計をサポート ✦ カードを自由にデザイン ✦ テスト版を自宅にお届け ✦ 正体隠匿系ゲームに対応 ✦ 協力ゲームに対応 ✦ 初心者でも安心のステップ式 ✦ 2〜3週間でお届け'

/* ───── Component ───── */
export default function Home() {
  const navigate = useNavigate()
  const setGenre = useGameStore((s) => s.setGenre)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleGenre = (key) => {
    setGenre(key)
    navigate('/rules')
  }
  const gotoRules = () => navigate('/rules')

  return (
    <div className="min-h-screen font-sans bg-bg overflow-x-hidden">
      {/* ========== NAV ========== */}
      <nav className="sticky top-0 z-50 bg-bg/97 backdrop-blur-md border-b border-navy/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-14">
          <a href="#" className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-accent-warm" />
            <span className="text-lg font-extrabold text-navy tracking-tight">GameBox</span>
          </a>
          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-semibold text-navy/60 hover:text-navy transition-colors">{l.label}</a>
            ))}
            <button type="button" onClick={gotoRules} className="ml-2 bg-navy text-white text-sm font-bold rounded-full px-5 py-2 hover:bg-navy/90 transition-colors cursor-pointer">
              無料でつくる
            </button>
          </div>
          {/* Mobile hamburger */}
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex flex-col gap-1.5 cursor-pointer p-1" aria-label="メニュー">
            <span className={`block w-5 h-0.5 bg-navy transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-navy transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-navy transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-navy/5 bg-bg/97 backdrop-blur-md px-5 pb-4 pt-2 space-y-3">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-navy/70">{l.label}</a>
            ))}
            <button type="button" onClick={gotoRules} className="w-full bg-navy text-white text-sm font-bold rounded-full px-5 py-2.5 cursor-pointer">無料でつくる</button>
          </div>
        )}
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative bg-bg dot-pattern-hero">
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
            {/* Left copy */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block bg-accent/30 text-navy text-xs font-bold px-4 py-1.5 rounded-full mb-6">
                カードゲーム専門のものづくりツール
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-navy leading-tight tracking-tight">
                頭の中の<br className="hidden md:inline" />
                <em className="not-italic text-navy-light italic">ゲームを、</em><br />
                <span className="relative inline-block">
                  この世に出そう
                  <span className="absolute left-0 -bottom-1 w-full h-2 bg-accent/50 rounded-full -z-10" />
                </span>
              </h1>
              <p className="mt-6 text-navy/55 text-base md:text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
                アイデアさえあれば大丈夫。ステップに沿って進めるだけで、本物のカードゲームが手元に届きます。
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <button type="button" onClick={gotoRules} className="bg-navy text-white font-bold rounded-full px-7 py-3.5 text-base hover:bg-navy/90 transition-colors cursor-pointer">
                  無料でゲームをつくる →
                </button>
                <a href="#how" className="bg-accent text-navy font-bold rounded-full px-7 py-3.5 text-base text-center hover:bg-accent/80 transition-colors">
                  サンプルを見る
                </a>
              </div>
            </div>
            {/* Right card stack */}
            <div className="relative w-64 h-72 shrink-0">
              {[
                { emoji: '🐺', label: '役割', rotate: '-rotate-12', offset: 'left-0 top-4', bg: 'bg-white' },
                { emoji: '💬', label: '会話', rotate: 'rotate-3', offset: 'left-8 top-0', bg: 'bg-accent' },
                { emoji: '🤝', label: '協力', rotate: 'rotate-12', offset: 'left-16 -top-2', bg: 'bg-navy' },
              ].map((card, i) => (
                <div
                  key={i}
                  className={`absolute ${card.offset} ${card.rotate} ${card.bg} w-40 h-56 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-3 border border-navy/10 transition-transform duration-300 hover:scale-105`}
                >
                  <span className="text-5xl">{card.emoji}</span>
                  <span className={`text-sm font-bold ${card.bg === 'bg-navy' ? 'text-white' : 'text-navy'}`}>{card.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <WaveTop fill="#0B1F5C" bg="#F0F4FF" />
      </section>

      {/* ========== MARQUEE ========== */}
      <section className="bg-navy py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[0, 1].map((i) => (
            <span key={i} className="text-white/70 text-sm font-semibold tracking-wide mx-0">
              {MARQUEE_TEXT}&nbsp;&nbsp;&nbsp;&nbsp;{MARQUEE_TEXT}&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how" className="bg-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-5">
          <p className="text-xs font-bold tracking-widest text-navy/40 uppercase text-center">How it works</p>
          <h2 className="mt-2 text-2xl md:text-4xl font-extrabold text-navy text-center">5ステップで、できあがります</h2>
          <div className="mt-12 space-y-4">
            {STEPS.map((s) => (
              <div key={s.n} className="group flex items-start gap-5 bg-bg rounded-2xl p-5 md:p-6 transition-transform duration-200 hover:translate-x-2">
                <span className="text-3xl md:text-4xl shrink-0">{s.emoji}</span>
                <div>
                  <span className="text-xs font-bold text-accent">{s.n}</span>
                  <h3 className="text-lg font-bold text-navy">{s.title}</h3>
                  <p className="mt-1 text-sm text-navy/50 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== GENRES ========== */}
      <WaveTop fill="#EBF1FF" bg="#ffffff" />
      <section id="genres" className="bg-bg-alt py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-5">
          <p className="text-xs font-bold tracking-widest text-navy/40 uppercase text-center">Genres</p>
          <h2 className="mt-2 text-2xl md:text-4xl font-extrabold text-navy text-center">好きなジャンルを選ぼう</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {GENRES.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => handleGenre(g.key)}
                className={`${g.cardClass} rounded-2xl p-8 text-left cursor-pointer transition-all duration-200 hover:-translate-y-2 hover:shadow-xl`}
              >
                <span className="text-5xl">{g.emoji}</span>
                <h3 className="mt-4 text-xl font-bold">{g.title}</h3>
                <p className="mt-2 text-sm opacity-75">{g.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>
      <WaveBottom fill="#EBF1FF" bg="#F0F4FF" />

      {/* ========== PRICING ========== */}
      <section id="pricing" className="bg-bg dot-pattern py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-xs font-bold tracking-widest text-navy/40 uppercase text-center">Pricing</p>
          <h2 className="mt-2 text-2xl md:text-4xl font-extrabold text-navy text-center">まずは無料でお試しください</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  p.highlighted ? 'bg-navy text-white ring-4 ring-accent' : 'bg-white text-navy border border-navy/10'
                }`}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-navy text-xs font-bold px-3 py-1 rounded-full">人気</span>
                )}
                <h3 className="text-sm font-bold opacity-70">{p.name}</h3>
                <p className="mt-2 text-3xl font-extrabold">{p.price}</p>
                <p className={`text-xs mt-1 ${p.highlighted ? 'text-white/60' : 'text-navy/40'}`}>{p.sub}</p>
                <ul className="mt-6 space-y-2 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className="text-accent">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={gotoRules}
                  className={`mt-6 w-full rounded-full py-3 text-sm font-bold cursor-pointer transition-colors ${
                    p.highlighted
                      ? 'bg-accent text-navy hover:bg-accent/80'
                      : 'bg-navy text-white hover:bg-navy/90'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <WaveTop fill="#0B1F5C" bg="#F0F4FF" />
      <section className="bg-navy py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-5">
          <p className="text-xs font-bold tracking-widest text-white/40 uppercase text-center">FAQ</p>
          <h2 className="mt-2 text-2xl md:text-4xl font-extrabold text-white text-center">よくある質問</h2>
          <div className="mt-12 space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="group bg-white/10 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-white font-semibold text-sm md:text-base list-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="text-accent text-xl leading-none transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-4 text-white/70 text-sm leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-navy border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <p className="text-lg font-extrabold text-white">
            Game<span className="text-accent">Box</span>
          </p>
          <p className="mt-2 text-white/40 text-sm">頭の中のゲームをこの世に引っ張り出す</p>
          <div className="mt-6 flex justify-center gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">利用規約</a>
            <a href="#" className="hover:text-white/60 transition-colors">プライバシーポリシー</a>
            <a href="#" className="hover:text-white/60 transition-colors">お問い合わせ</a>
          </div>
          <p className="mt-6 text-xs text-white/20">&copy; 2026 GameBox. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
