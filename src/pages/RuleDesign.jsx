import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { checkRules } from '../lib/ruleChecker'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

/* ───── Templates ───── */
const TEMPLATES = [
  { key: 'werewolf', emoji: '🐺', name: '正体隠匿', desc: '役割カードで正体を隠しながら議論するゲーム' },
  { key: 'word', emoji: '💬', name: 'ワード系', desc: 'お題や言葉をヒントに正解を目指すゲーム' },
  { key: 'coop', emoji: '🤝', name: '協力ゲーム', desc: '全員で協力してミッションをクリアするゲーム' },
  { key: 'mystery', emoji: '🔍', name: '推理ゲーム', desc: '証拠を集めて謎を解き明かすゲーム' },
  { key: 'original', emoji: '✨', name: 'オリジナル', desc: 'テンプレートなしで自由に設計する' },
]

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

/* ───── Sortable Phase Item ───── */
function SortablePhase({ phase, index, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: phase.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="bg-white border-2 border-navy/10 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" {...attributes} {...listeners}
          className="cursor-grab active:cursor-grabbing text-navy/30 hover:text-navy/60 shrink-0 touch-none">
          ⠿
        </button>
        <span className="text-xs font-bold text-navy/40 shrink-0">#{index + 1}</span>
        <input type="text" value={phase.name} onChange={(e) => onChange({ ...phase, name: e.target.value })}
          placeholder="例：夜のフェーズ" className="flex-1 text-sm font-bold text-navy bg-transparent outline-none placeholder:text-navy/25" />
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer shrink-0">削除</button>
      </div>
      <textarea value={phase.content} onChange={(e) => onChange({ ...phase, content: e.target.value })}
        placeholder="例：人狼プレイヤーは目を開けて、処刑する村人を1人指定する" rows={2}
        className="w-full text-sm text-navy bg-navy/3 rounded-lg px-3 py-2 outline-none placeholder:text-navy/25 resize-none" />
      <input type="text" value={phase.endCondition} onChange={(e) => onChange({ ...phase, endCondition: e.target.value })}
        placeholder="終了条件（任意）：例：人狼が合意したら終了"
        className="w-full text-xs text-navy/70 bg-navy/3 rounded-lg px-3 py-2 outline-none placeholder:text-navy/25" />
    </div>
  )
}

/* ───── Accordion Section ───── */
function Section({ title, icon, open, onToggle, completed, onComplete, children }) {
  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-colors ${completed ? 'border-green-300 bg-green-50/30' : 'border-navy/10 bg-white'}`}>
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-navy/3 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className={`text-sm font-black ${completed ? 'text-green-700' : 'text-navy'}`}>{title}</span>
          {completed && <span className="text-green-600 text-xs font-bold">✓ 記入済み</span>}
        </div>
        <span className={`text-navy/30 text-sm transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3">
          {children}
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input type="checkbox" checked={completed} onChange={onComplete}
              className="w-4 h-4 rounded accent-green-600" />
            <span className="text-xs font-bold text-navy/50">このセクションを記入済みにする</span>
          </label>
        </div>
      )}
    </div>
  )
}

/* ───── AI Feedback Panel ───── */
function FeedbackPanel({ feedback, loading, error }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-navy/50">ルールを読み込んでいます...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-xl">
        <p className="text-sm text-red-600 font-bold">エラーが発生しました</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <span className="text-4xl mb-4">🤖</span>
        <p className="text-sm text-navy/50 leading-relaxed">
          ルールを書き終えたら<br />
          「AIにチェックしてもらう」を押してください。<br />
          <span className="text-navy/30 text-xs mt-2 block">矛盾や抜け穴、わかりにくい点をフィードバックします。</span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-sm">
      {/* Overall */}
      {feedback.overall && (
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-navy leading-relaxed">{feedback.overall}</p>
        </div>
      )}

      {/* Issues */}
      {feedback.issues?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-black text-navy/40 uppercase tracking-widest">指摘事項</h4>
          {feedback.issues.map((issue, i) => {
            const borderColor = issue.type === 'error' ? 'border-red-300 bg-red-50' : issue.type === 'warning' ? 'border-yellow-300 bg-yellow-50' : 'border-blue-300 bg-blue-50'
            const icon = issue.type === 'error' ? '🔴' : issue.type === 'warning' ? '🟡' : '🔵'
            return (
              <div key={i} className={`border-2 rounded-xl p-3 ${borderColor}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">{icon}</span>
                  <div>
                    <p className="font-bold text-navy">{issue.title}</p>
                    <p className="text-navy/70 mt-0.5">{issue.description}</p>
                    {issue.suggestion && (
                      <p className="text-navy/50 mt-1 italic text-xs">改善案：{issue.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Strengths */}
      {feedback.strengths?.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-black text-navy/40 uppercase tracking-widest">良い点</h4>
          {feedback.strengths.map((s, i) => (
            <p key={i} className="text-green-700 flex items-start gap-1.5">
              <span className="shrink-0">✅</span>
              <span>{s}</span>
            </p>
          ))}
        </div>
      )}

      {/* Missing */}
      {feedback.missing?.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-black text-navy/40 uppercase tracking-widest">未記入の項目</h4>
          {feedback.missing.map((m, i) => (
            <p key={i} className="text-amber-700 flex items-start gap-1.5">
              <span className="shrink-0">⚠️</span>
              <span>{m}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───── Main Page ───── */
export default function RuleDesign() {
  const navigate = useNavigate()
  const { template, rules, setTemplate, setRules, setGameTitle } = useGameStore()
  const [phase, setPhase] = useState(template ? 'editor' : 'template')
  const [openSections, setOpenSections] = useState([1, 2, 3, 4])
  const [feedback, setFeedback] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const inputClass = 'w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors'

  const toggleSection = (n) => {
    setOpenSections((s) => s.includes(n) ? s.filter((x) => x !== n) : [...s, n])
  }

  const isCompleted = (n) => (rules.completedSections || []).includes(n)
  const toggleCompleted = (n) => {
    const current = rules.completedSections || []
    const next = current.includes(n) ? current.filter((x) => x !== n) : [...current, n]
    setRules({ completedSections: next })
  }

  // Faction helpers
  const updateFaction = (index, data) => {
    const factions = [...(rules.factions || [])]
    factions[index] = { ...factions[index], ...data }
    setRules({ factions })
  }
  const addFaction = () => {
    setRules({ factions: [...(rules.factions || []), { id: uid(), name: '', winCondition: '' }] })
  }
  const removeFaction = (index) => {
    setRules({ factions: (rules.factions || []).filter((_, i) => i !== index) })
  }

  // Phase helpers
  const updatePhase = (index, data) => {
    const phases = [...(rules.phases || [])]
    phases[index] = data
    setRules({ phases })
  }
  const addPhase = () => {
    setRules({ phases: [...(rules.phases || []), { id: uid(), name: '', content: '', endCondition: '' }] })
  }
  const removePhase = (index) => {
    setRules({ phases: (rules.phases || []).filter((_, i) => i !== index) })
  }
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const phases = rules.phases || []
    const oldIndex = phases.findIndex((p) => p.id === active.id)
    const newIndex = phases.findIndex((p) => p.id === over.id)
    setRules({ phases: arrayMove(phases, oldIndex, newIndex) })
  }

  // Special rules helpers
  const updateSpecialRule = (index, data) => {
    const specialRules = [...(rules.specialRules || [])]
    specialRules[index] = { ...specialRules[index], ...data }
    setRules({ specialRules })
  }
  const addSpecialRule = () => {
    setRules({ specialRules: [...(rules.specialRules || []), { id: uid(), title: '', description: '' }] })
  }
  const removeSpecialRule = (index) => {
    setRules({ specialRules: (rules.specialRules || []).filter((_, i) => i !== index) })
  }

  // AI check
  const handleAiCheck = useCallback(async () => {
    setAiLoading(true)
    setAiError(null)
    setFeedback(null)
    try {
      const result = await checkRules(rules)
      setFeedback(result)
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }, [rules])

  const handleNext = () => {
    setGameTitle(rules.gameTitle || '')
    navigate('/cards')
  }

  // ─── PHASE 1: Template Selection ───
  if (phase === 'template') {
    return (
      <PageShell>
        <h1 className="text-2xl md:text-3xl font-black text-navy">ゲームのタイプを選択</h1>
        <p className="mt-1 text-navy/50 text-sm">テンプレートを選ぶと初期構成が提案されます</p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button key={t.key} type="button"
              onClick={() => { setTemplate(t.key); setPhase('editor') }}
              className="text-left rounded-2xl border-2 border-navy/10 bg-white p-5 hover:border-navy/30 hover:-translate-y-0.5 transition-all cursor-pointer">
              <span className="text-3xl">{t.emoji}</span>
              <p className="mt-2 font-black text-navy text-sm">{t.name}</p>
              <p className="text-xs text-navy/40 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </PageShell>
    )
  }

  // ─── PHASE 2: Rule Editor ───
  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-black text-navy">ルール設計</h1>
      <p className="mt-1 text-navy/50 text-sm">ゲームのルールを言語化しましょう</p>

      <div className="mt-8 flex flex-col lg:flex-row gap-6">
        {/* ─── Left Column: Rule Sections ─── */}
        <div className="lg:w-[60%] space-y-4">

          {/* Section 1: Basic Info */}
          <Section title="ゲームの基本情報" icon="📋" open={openSections.includes(1)}
            onToggle={() => toggleSection(1)} completed={isCompleted(1)} onComplete={() => toggleCompleted(1)}>
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">ゲームタイトル</label>
              <input type="text" value={rules.gameTitle || ''} onChange={(e) => setRules({ gameTitle: e.target.value })}
                placeholder="例：深夜の人狼" className={`${inputClass} text-lg font-bold`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy/60 mb-1">最少人数</label>
                <input type="number" min={1} max={20} value={rules.players?.min || 2}
                  onChange={(e) => setRules({ players: { ...rules.players, min: Number(e.target.value) } })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-navy/60 mb-1">最大人数</label>
                <input type="number" min={1} max={20} value={rules.players?.max || 6}
                  onChange={(e) => setRules({ players: { ...rules.players, max: Number(e.target.value) } })}
                  className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">プレイ時間（目安）</label>
              <input type="text" value={rules.duration || ''} onChange={(e) => setRules({ duration: e.target.value })}
                placeholder="例：15〜30分" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">ゲームの雰囲気・テーマ</label>
              <textarea value={rules.theme || ''} onChange={(e) => setRules({ theme: e.target.value })}
                placeholder="例：友達を疑いながらも協力しなければならない緊張感" rows={2}
                className={`${inputClass} resize-none`} />
            </div>
          </Section>

          {/* Section 2: Factions / Win Conditions */}
          <Section title="ゲームの目的" icon="🏆" open={openSections.includes(2)}
            onToggle={() => toggleSection(2)} completed={isCompleted(2)} onComplete={() => toggleCompleted(2)}>
            <p className="text-xs text-navy/40">各陣営の勝利条件を設定してください。</p>
            <div className="space-y-2">
              {(rules.factions || []).map((f, i) => (
                <div key={f.id} className="bg-navy/3 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={f.name} onChange={(e) => updateFaction(i, { name: e.target.value })}
                      placeholder="陣営名（例：村人側）"
                      className="flex-1 text-sm font-bold text-navy bg-transparent outline-none placeholder:text-navy/25" />
                    {(rules.factions || []).length > 1 && (
                      <button type="button" onClick={() => removeFaction(i)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer">削除</button>
                    )}
                  </div>
                  <textarea value={f.winCondition} onChange={(e) => updateFaction(i, { winCondition: e.target.value })}
                    placeholder="勝利条件（例：人狼を全員処刑すれば村人の勝利）" rows={2}
                    className="w-full text-sm text-navy bg-white rounded-lg px-3 py-2 outline-none placeholder:text-navy/25 resize-none border border-navy/10" />
                </div>
              ))}
            </div>
            <button type="button" onClick={addFaction}
              className="text-xs font-bold text-navy/50 bg-navy/5 px-4 py-2 rounded-full hover:bg-navy/10 cursor-pointer transition-colors">
              ＋ 陣営を追加
            </button>
          </Section>

          {/* Section 3: Game Flow / Phases */}
          <Section title="ゲームの流れ" icon="🔄" open={openSections.includes(3)}
            onToggle={() => toggleSection(3)} completed={isCompleted(3)} onComplete={() => toggleCompleted(3)}>
            <p className="text-xs text-navy/40">ターン・フェーズを順番に記述してください。ドラッグで並び替えできます。</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={(rules.phases || []).map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {(rules.phases || []).map((p, i) => (
                    <SortablePhase key={p.id} phase={p} index={i}
                      onChange={(data) => updatePhase(i, data)}
                      onRemove={() => removePhase(i)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <button type="button" onClick={addPhase}
              className="text-xs font-bold text-navy/50 bg-navy/5 px-4 py-2 rounded-full hover:bg-navy/10 cursor-pointer transition-colors">
              ＋ フェーズを追加
            </button>
          </Section>

          {/* Section 4: Special Rules */}
          <Section title="特殊ルール・例外" icon="⚡" open={openSections.includes(4)}
            onToggle={() => toggleSection(4)} completed={isCompleted(4)} onComplete={() => toggleCompleted(4)}>
            <p className="text-xs text-navy/40">特殊能力や例外ルールを追加できます。</p>
            <div className="space-y-2">
              {(rules.specialRules || []).map((r, i) => (
                <div key={r.id} className="bg-navy/3 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={r.title} onChange={(e) => updateSpecialRule(i, { title: e.target.value })}
                      placeholder="ルール名（例：占師の能力）"
                      className="flex-1 text-sm font-bold text-navy bg-transparent outline-none placeholder:text-navy/25" />
                    {(rules.specialRules || []).length > 1 && (
                      <button type="button" onClick={() => removeSpecialRule(i)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer">削除</button>
                    )}
                  </div>
                  <textarea value={r.description} onChange={(e) => updateSpecialRule(i, { description: e.target.value })}
                    placeholder="例：占師は毎晩1人のプレイヤーの正体を知ることができる" rows={2}
                    className="w-full text-sm text-navy bg-white rounded-lg px-3 py-2 outline-none placeholder:text-navy/25 resize-none border border-navy/10" />
                </div>
              ))}
            </div>
            <button type="button" onClick={addSpecialRule}
              className="text-xs font-bold text-navy/50 bg-navy/5 px-4 py-2 rounded-full hover:bg-navy/10 cursor-pointer transition-colors">
              ＋ ルールを追加
            </button>
          </Section>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button type="button" onClick={handleAiCheck} disabled={aiLoading}
              className="w-full rounded-full bg-accent text-navy font-black py-4 text-base hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50">
              {aiLoading ? 'チェック中...' : '🤖 AIにルールをチェックしてもらう'}
            </button>
            <Button onClick={handleNext} className="w-full">
              次へ → カード構成
            </Button>
          </div>
        </div>

        {/* ─── Right Column: AI Feedback ─── */}
        <div className="lg:w-[40%]">
          <div className="lg:sticky lg:top-6">
            <Card className="p-5 bg-navy/3 min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-black text-navy/40 uppercase tracking-widest">AIフィードバック</h2>
                {feedback && (
                  <button type="button" onClick={handleAiCheck} disabled={aiLoading}
                    className="text-[10px] font-bold text-navy/50 bg-white px-3 py-1 rounded-full hover:bg-navy/10 cursor-pointer transition-colors border border-navy/10">
                    もう一度チェック
                  </button>
                )}
              </div>
              <FeedbackPanel feedback={feedback} loading={aiLoading} error={aiError} />
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
