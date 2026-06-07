import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'

/* ───── Templates ───── */
const TEMPLATES = [
  { key: 'werewolf', emoji: '🐺', name: '正体隠匿', desc: '役割カードで正体を隠しながら議論するゲーム' },
  { key: 'word', emoji: '💬', name: 'ワード系', desc: 'お題や言葉をヒントに正解を目指すゲーム' },
  { key: 'coop', emoji: '🤝', name: '協力系', desc: '全員で協力してミッションをクリアするゲーム' },
  { key: 'mystery', emoji: '🎯', name: '推理系', desc: '情報を集めて犯人や答えを当てるゲーム' },
  { key: 'original', emoji: '✨', name: 'オリジナル', desc: 'テンプレートなしでゼロから設計する' },
]

const DURATION_OPTIONS = ['〜15分', '15〜30分', '30〜60分', '60分〜']
const SPECIAL_ROLES = ['占師', '騎士', '霊媒師']
const WORD_GENRES = ['食べ物', '場所', '動物', 'なんでも']
const HINT_COUNTS = ['1回', '3回', '無制限']
const DISCUSSION_TIMES = ['1分', '3分', '5分', '制限なし']

/* ───── Per-template extra questions ───── */
function getExtraQuestions(template, players) {
  const maxVillains = Math.floor(players / 2)
  switch (template) {
    case 'werewolf': return [
      { key: 'villains', label: `悪役（人狼側）は何人いますか？`, type: 'slider', min: 1, max: maxVillains },
      { key: 'roles', label: '市民側にどんな特殊役職を入れますか？', type: 'checkbox', options: SPECIAL_ROLES },
      { key: 'discussion', label: '昼の議論時間は？', type: 'select', options: DISCUSSION_TIMES },
    ]
    case 'word': return [
      { key: 'wordGenre', label: 'お題はどんなジャンルにしますか？', type: 'select', options: WORD_GENRES },
      { key: 'hints', label: 'ヒントは何回まで出せますか？', type: 'select', options: HINT_COUNTS },
    ]
    case 'coop': return [
      { key: 'clearCondition', label: 'クリア条件は何ですか？', type: 'text' },
      { key: 'failCondition', label: '失敗条件は何ですか？', type: 'text' },
    ]
    default: return []
  }
}

const inputClass = 'w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors text-base'

export default function RuleDesign() {
  const navigate = useNavigate()
  const store = useGameStore()
  const [step, setStep] = useState('template') // 'template' | 'questions'
  const [selectedTemplate, setSelectedTemplate] = useState(store.template || '')
  const [qIndex, setQIndex] = useState(0)

  // Question answers (local state, flushed on completion)
  const [title, setTitle] = useState(store.gameTitle)
  const [players, setPlayers] = useState(store.rules.players || 4)
  const [duration, setDuration] = useState(store.rules.duration || '15〜30分')
  const [objective, setObjective] = useState(store.rules.objective || '')
  const [extraAnswers, setExtraAnswers] = useState(store.rules.template_answers || {})

  const extraQs = getExtraQuestions(selectedTemplate, players)
  const allQuestions = [
    { key: 'title', label: 'ゲームのタイトルを教えてください', type: 'text' },
    { key: 'players', label: '何人で遊びますか？', type: 'slider', min: 2, max: 10 },
    { key: 'duration', label: '1回のプレイ時間は？', type: 'select', options: DURATION_OPTIONS },
    { key: 'objective', label: 'ゲームの目的は？', type: 'text', placeholder: '例：〇〇を最初に達成した人が勝ち' },
    ...extraQs,
  ]
  const currentQ = allQuestions[qIndex]
  const totalQs = allQuestions.length

  const handleTemplateSelect = (key) => {
    setSelectedTemplate(key)
    setStep('questions')
    setQIndex(0)
  }

  const getAnswer = () => {
    switch (currentQ?.key) {
      case 'title': return title
      case 'players': return players
      case 'duration': return duration
      case 'objective': return objective
      default: return extraAnswers[currentQ?.key] ?? ''
    }
  }

  const setAnswer = (val) => {
    switch (currentQ?.key) {
      case 'title': return setTitle(val)
      case 'players': return setPlayers(val)
      case 'duration': return setDuration(val)
      case 'objective': return setObjective(val)
      default: return setExtraAnswers((p) => ({ ...p, [currentQ.key]: val }))
    }
  }

  const handleNext = () => {
    if (qIndex < totalQs - 1) {
      setQIndex(qIndex + 1)
    } else {
      // Save everything to store
      store.setTemplate(selectedTemplate)
      store.setGameTitle(title)
      store.setRules({ players, duration, objective, template_answers: extraAnswers })
      navigate('/cards')
    }
  }

  const handleBack = () => {
    if (qIndex > 0) setQIndex(qIndex - 1)
    else setStep('template')
  }

  /* ═══ Template Selection ═══ */
  if (step === 'template') {
    return (
      <PageShell>
        <h1 className="text-2xl md:text-3xl font-black text-navy">テンプレートを選ぶ</h1>
        <p className="mt-1 text-navy/50 text-sm">作りたいゲームに近いテンプレートを選んでください</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTemplateSelect(t.key)}
              className={`text-left rounded-2xl p-5 transition-all duration-200 cursor-pointer ${
                selectedTemplate === t.key
                  ? 'border-[2.5px] border-navy bg-bg-alt'
                  : 'border-[2.5px] border-step-border bg-white hover:border-navy/40'
              }`}
            >
              <span className="text-3xl">{t.emoji}</span>
              <h3 className="mt-2 text-base font-black text-navy">{t.name}</h3>
              <p className="mt-1 text-xs text-navy/50 leading-relaxed">{t.desc}</p>
            </button>
          ))}
        </div>
      </PageShell>
    )
  }

  /* ═══ Question Wizard ═══ */
  return (
    <PageShell>
      {/* Progress */}
      <div className="flex items-center gap-2 text-xs font-bold text-navy/40 mb-2">
        <span className="bg-accent text-navy px-2 py-0.5 rounded-full">{qIndex + 1} / {totalQs}</span>
        <div className="flex-1 h-1.5 bg-navy/10 rounded-full overflow-hidden">
          <div className="h-full bg-navy rounded-full transition-all duration-300" style={{ width: `${((qIndex + 1) / totalQs) * 100}%` }} />
        </div>
      </div>

      <h1 className="text-xl md:text-2xl font-black text-navy mt-6">{currentQ.label}</h1>

      <div className="mt-8">
        {currentQ.type === 'text' && (
          <input
            type="text"
            value={getAnswer()}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={currentQ.placeholder || ''}
            className={inputClass}
            autoFocus
          />
        )}

        {currentQ.type === 'slider' && (
          <div>
            <div className="text-center mb-4">
              <span className="text-5xl font-black text-navy">{getAnswer()}</span>
              <span className="text-lg text-navy/50 ml-1">人</span>
            </div>
            <input
              type="range"
              min={currentQ.min}
              max={currentQ.max}
              value={getAnswer()}
              onChange={(e) => setAnswer(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-navy/40 mt-1">
              <span>{currentQ.min}</span>
              <span>{currentQ.max}</span>
            </div>
          </div>
        )}

        {currentQ.type === 'select' && (
          <div className="grid grid-cols-2 gap-2">
            {currentQ.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAnswer(opt)}
                className={`rounded-full py-3 text-sm font-bold transition-all cursor-pointer ${
                  getAnswer() === opt
                    ? 'bg-navy text-white'
                    : 'bg-white border-2 border-step-border text-navy/60 hover:border-navy/30'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {currentQ.type === 'checkbox' && (
          <div className="grid grid-cols-2 gap-2">
            {currentQ.options.map((opt) => {
              const selected = Array.isArray(getAnswer()) ? getAnswer() : []
              const isChecked = selected.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const next = isChecked ? selected.filter((s) => s !== opt) : [...selected, opt]
                    setAnswer(next)
                  }}
                  className={`rounded-full py-3 text-sm font-bold transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-navy text-white'
                      : 'bg-white border-2 border-step-border text-navy/60 hover:border-navy/30'
                  }`}
                >
                  {isChecked ? '✓ ' : ''}{opt}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <Button onClick={handleNext} className="w-full">
          {qIndex < totalQs - 1 ? '次の質問へ' : 'カード構成へ進む →'}
        </Button>
        <button type="button" onClick={handleBack} className="text-sm text-navy/40 font-semibold hover:text-navy/60 transition-colors cursor-pointer">
          ← 前に戻る
        </button>
      </div>
    </PageShell>
  )
}
