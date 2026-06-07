import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

/* ───── Waves ───── */
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

/* ───── Data ───── */
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

const MARQUEE_ITEMS = ['ルール設計をサポート', 'カードを自由にデザイン', 'テスト版を自宅にお届け', '正体隠匿系ゲームに対応', '協力ゲームに対応', '初心者でも安心のステップ式', '2〜3週間でお届け']

const HERO_CARDS = [
  { emoji: '🐺', label: '役割', border: '#0B1F5C', color: '#0B1F5C', rotate: '-11deg', shadow: '3px 5px 0 #8090B8', z: 10 },
  { emoji: '💬', label: '会話', border: '#FFBC00', color: '#7A5900', rotate: '-2deg', shadow: '3px 5px 0 #D4AA00', z: 20 },
  { emoji: '🤝', label: '協力', border: '#2C52C8', color: '#2C52C8', rotate: '9deg', shadow: '3px 5px 0 #8090D0', z: 30 },
]

/* ───── Component ───── */
export default function Home() {
  const navigate = useNavigate()
  const setGenre = useGameStore((s) => s.setGenre)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const handleGenre = (key) => { setGenre(key); navigate('/rules') }
  const gotoRules = () => navigate('/rules')

  return (
    <div className="min-h-screen font-sans bg-bg overflow-x-hidden">

      {/* ═══════ NAV ═══════ */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-navy/5" style={{ background: 'rgba(240,244,255,0.97)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-14">
          <a href="#" className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#FFBC00' }} />
            <span className="text-lg font-extrabold text-navy tracking-tight">GameBox</span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-semibold text-navy/60 hover:text-navy transition-colors">{l.label}</a>
            ))}
            <button type="button" onClick={gotoRules} className="ml-2 bg-navy text-white text-sm font-bold rounded-full px-5 py-2 hover:bg-navy/90 transition-colors cursor-pointer" style={{ boxShadow: '0 4px 14px rgba(11,31,92,.28)' }}>
              無料でつくる
            </button>
          </div>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex flex-col gap-1.5 cursor-pointer p-1" aria-label="メニュー">
            <span className={`block w-5 h-0.5 bg-navy transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-navy transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-navy transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-navy/5 px-5 pb-4 pt-2 space-y-3" style={{ background: 'rgba(240,244,255,0.97)' }}>
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-navy/70">{l.label}</a>
            ))}
            <button type="button" onClick={gotoRules} className="w-full bg-navy text-white text-sm font-bold rounded-full px-5 py-2.5 cursor-pointer">無料でつくる</button>
          </div>
        )}
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative bg-bg dot-pattern-hero">
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-28 md:pt-24 md:pb-36">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block text-navy text-xs font-bold px-4 py-1.5 rounded-full mb-6" style={{ background: '#FFD233' }}>
                カードゲーム専門のものづくりツール
              </span>
              <h1 className="font-black text-navy leading-tight tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 46px)' }}>
                頭の中の<br className="hidden md:inline" />
                <em className="not-italic italic" style={{ color: '#2C52C8' }}>ゲームを、</em><br />
                <span className="relative inline-block">
                  この世に出そう
                  <span className="absolute left-0 bottom-0 w-full rounded-full" style={{ height: 6, background: '#FFD233', zIndex: -1 }} />
                </span>
              </h1>
              <p className="mt-6 text-base md:text-lg leading-relaxed max-w-lg mx-auto md:mx-0" style={{ color: 'rgba(11,31,92,0.55)' }}>
                アイデアさえあれば大丈夫。ステップに沿って進めるだけで、本物のカードゲームが手元に届きます。
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <button type="button" onClick={gotoRules} className="text-white font-bold rounded-full px-7 py-3.5 text-base hover:opacity-90 transition-opacity cursor-pointer" style={{ background: '#0B1F5C', boxShadow: '0 4px 14px rgba(11,31,92,.28)' }}>
                  無料でゲームをつくる →
                </button>
                <a href="#how" className="font-bold rounded-full px-7 py-3.5 text-base text-center hover:opacity-90 transition-opacity" style={{ background: '#FFD233', color: '#7A5900', border: '2px solid #FFBC00' }}>
                  サンプルを見る
                </a>
              </div>
            </div>
            {/* Card stack */}
            <div className="relative shrink-0" style={{ width: 200, height: 180 }}>
              {HERO_CARDS.map((c, i) => (
                <div
                  key={i}
                  className="absolute bg-white flex flex-col items-center justify-center gap-1 transition-transform duration-300 hover:scale-110"
                  style={{
                    width: 86, height: 120, borderRadius: 16, border: `3px solid ${c.border}`,
                    transform: `rotate(${c.rotate})`,
                    boxShadow: c.shadow,
                    zIndex: c.z,
                    left: i * 50, top: i === 1 ? 10 : i === 2 ? 5 : 20,
                  }}
                >
                  <span className="text-3xl">{c.emoji}</span>
                  <span className="text-[10px] font-black" style={{ color: c.color }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <WaveTop fill="#0B1F5C" bg="#F0F4FF" />
      </section>

      {/* ═══════ MARQUEE ═══════ */}
      <section className="bg-navy py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[0, 1].map((dup) => (
            <span key={dup} className="flex items-center gap-0">
              {MARQUEE_ITEMS.map((item, i) => (
                <span key={`${dup}-${i}`} className="flex items-center">
                  <span className="text-white text-sm font-semibold tracking-wide">{item}</span>
                  <span className="text-accent mx-4 text-sm">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how" className="bg-white py-20 md:py-28">
        <div className="max-w-xl mx-auto px-5">
          <p className="text-center font-bold text-navy uppercase" style={{ fontSize: 11, letterSpacing: '2.5px' }}>How it works</p>
          <h2 className="mt-3 text-2xl md:text-4xl font-black text-navy text-center">5ステップで、できあがります</h2>
          <div className="mt-12 space-y-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="group flex items-center gap-4 bg-white rounded-[18px] p-[18px_20px] transition-all duration-200 hover:translate-x-2 cursor-default"
                style={{ border: '2.5px solid #D0DAEF' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0B1F5C'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,31,92,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D0DAEF'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <span className="text-navy font-black shrink-0" style={{ fontSize: 36, opacity: 0.18 }}>{s.n}</span>
                <span className="text-[32px] shrink-0">{s.emoji}</span>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-navy">{s.title}</h3>
                  <p className="text-xs text-navy/50 leading-relaxed mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ GENRES ═══════ */}
      <WaveTop fill="#EBF1FF" bg="#ffffff" />
      <section id="genres" className="bg-bg-alt py-20 md:py-28">
        <div className="max-w-lg mx-auto px-5">
          <p className="text-center font-bold text-navy uppercase" style={{ fontSize: 11, letterSpacing: '2.5px' }}>Genres</p>
          <h2 className="mt-3 text-2xl md:text-4xl font-black text-navy text-center">好きなジャンルを選ぼう</h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Party */}
            <button type="button" onClick={() => handleGenre('party')}
              className="bg-navy text-white rounded-[26px] p-6 text-center cursor-pointer transition-transform duration-200 hover:scale-[1.025]">
              <span className="text-4xl block">🎭</span>
              <span className="inline-block mt-3 text-[10px] font-bold bg-white/15 px-3 py-0.5 rounded-full">Party</span>
              <h3 className="mt-2 text-lg font-black">みんなでわいわい</h3>
              <p className="mt-1 text-xs text-white/70 leading-relaxed">正体隠匿・ブラフ・大喜利など、盛り上がるゲームに</p>
            </button>
            {/* Coop */}
            <button type="button" onClick={() => handleGenre('coop')}
              className="rounded-[26px] p-6 text-center cursor-pointer transition-transform duration-200 hover:scale-[1.025]"
              style={{ background: '#FFD233', color: '#7A5900' }}>
              <span className="text-4xl block">🤝</span>
              <span className="inline-block mt-3 text-[10px] font-bold px-3 py-0.5 rounded-full" style={{ background: 'rgba(122,89,0,0.12)' }}>Coop</span>
              <h3 className="mt-2 text-lg font-black">全員でクリア!</h3>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'rgba(122,89,0,0.7)' }}>全員で協力してミッション達成を目指すゲームに</p>
            </button>
          </div>
        </div>
      </section>
      <WaveBottom fill="#EBF1FF" bg="#F0F4FF" />

      {/* ═══════ PRICING ═══════ */}
      <WaveTop fill="#F0F4FF" bg="#F0F4FF" />
      <section id="pricing" className="bg-bg dot-pattern py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-center font-bold text-navy uppercase" style={{ fontSize: 11, letterSpacing: '2.5px' }}>Pricing</p>
          <h2 className="mt-3 text-2xl md:text-4xl font-black text-navy text-center">まずは無料でお試しください</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((p) => (
              <div key={p.name}
                className={`relative rounded-2xl p-6 flex flex-col ${p.highlighted ? 'bg-navy text-white ring-4 ring-accent' : 'bg-white text-navy border border-navy/10'}`}>
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-navy text-xs font-bold px-3 py-1 rounded-full">人気</span>
                )}
                <h3 className="text-sm font-bold opacity-70">{p.name}</h3>
                <p className="mt-2 text-3xl font-extrabold">{p.price}</p>
                <p className={`text-xs mt-1 ${p.highlighted ? 'text-white/60' : 'text-navy/40'}`}>{p.sub}</p>
                <ul className="mt-6 space-y-2 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm"><span className="text-accent">✓</span>{f}</li>
                  ))}
                </ul>
                <button type="button" onClick={gotoRules}
                  className={`mt-6 w-full rounded-full py-3 text-sm font-bold cursor-pointer transition-colors ${p.highlighted ? 'bg-accent text-navy hover:bg-accent/80' : 'bg-navy text-white hover:bg-navy/90'}`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <WaveTop fill="#0B1F5C" bg="#F0F4FF" />
      <section className="bg-navy py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-5">
          <p className="text-center font-bold text-white/40 uppercase" style={{ fontSize: 11, letterSpacing: '2.5px' }}>FAQ</p>
          <h2 className="mt-3 text-2xl md:text-4xl font-black text-white text-center">よくある質問</h2>
          <div className="mt-12 space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white/10 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full cursor-pointer px-5 py-4 text-white font-semibold text-sm md:text-base text-left"
                >
                  <span>{faq.q}</span>
                  <span className={`text-accent text-xl leading-none transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-white/70 text-sm leading-relaxed" style={{ animation: 'fadeIn 0.2s ease-out' }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-navy border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <p className="text-lg font-extrabold text-white">Game<span className="text-accent">Box</span></p>
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
