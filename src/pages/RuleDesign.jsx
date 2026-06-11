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
import MarkdownField from '../components/ui/MarkdownField'

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
          placeholder="例：準備フェーズ" className="flex-1 text-sm font-bold text-navy bg-transparent outline-none placeholder:text-navy/25" />
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer shrink-0">削除</button>
      </div>
      <MarkdownField value={phase.content} onChange={(v) => onChange({ ...phase, content: v })}
        placeholder="例：各プレイヤーにカードを3枚配る" minHeight={80} />
      <input type="text" value={phase.endCondition} onChange={(e) => onChange({ ...phase, endCondition: e.target.value })}
        placeholder="終了条件（任意）：例：全員がカードを受け取ったら次のフェーズへ"
        className="w-full text-xs text-navy/70 bg-navy/3 rounded-lg px-3 py-2 outline-none placeholder:text-navy/25" />
    </div>
  )
}

/* ───── Sortable Section Wrapper ───── */
function SortableSection({ section, children, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: { ...attributes, ...listeners }, onDelete: section.deletable ? onDelete : null })}
    </div>
  )
}

/* ───── Accordion Section ───── */
function Section({ title, icon, open, onToggle, completed, onComplete, dragHandleProps, onDelete, children }) {
  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-colors ${completed ? 'border-green-300 bg-green-50/30' : 'border-navy/10 bg-white'}`}>
      <div className="flex items-center px-5 py-4">
        <button type="button" {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-navy/30 hover:text-navy/60 mr-3 touch-none shrink-0">
          ⠿
        </button>
        <button type="button" onClick={onToggle}
          className="flex-1 flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className={`text-sm font-black ${completed ? 'text-green-700' : 'text-navy'}`}>{title}</span>
            {completed && <span className="text-green-600 text-xs font-bold">✓</span>}
          </div>
          <span className={`text-navy/30 text-sm transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete}
            className="ml-2 text-xs text-gray-400 hover:text-red-500 font-bold cursor-pointer shrink-0">削除</button>
        )}
      </div>
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

/* ───── Add Section Modal ───── */
function AddSectionModal({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [sectionType, setSectionType] = useState('text')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-black text-navy mb-4">セクションを追加</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-navy/60 mb-1">セクション名</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="例：コンポーネント一覧"
              className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy/60 mb-2">タイプ</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSectionType('text')}
                className={`flex-1 rounded-full py-2.5 text-sm font-bold cursor-pointer transition-all ${sectionType === 'text' ? 'bg-navy text-white' : 'bg-white border-2 border-step-border text-navy/60'}`}>
                📝 テキスト
              </button>
              <button type="button" onClick={() => setSectionType('list')}
                className={`flex-1 rounded-full py-2.5 text-sm font-bold cursor-pointer transition-all ${sectionType === 'list' ? 'bg-navy text-white' : 'bg-white border-2 border-step-border text-navy/60'}`}>
                📋 リスト
              </button>
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-full border-2 border-navy/15 text-navy font-bold py-2.5 text-sm hover:bg-navy/5 transition-colors cursor-pointer">
            キャンセル
          </button>
          <button type="button" onClick={() => { if (name.trim()) onAdd(name.trim(), sectionType) }}
            disabled={!name.trim()}
            className="flex-1 rounded-full bg-navy text-white font-bold py-2.5 text-sm hover:bg-navy/90 transition-colors cursor-pointer disabled:opacity-40">
            追加する
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───── Custom Section Content ───── */
function CustomSectionContent({ section, rules, setRules }) {
  const data = rules.customSections?.[section.id] || (section.sectionType === 'list' ? { items: [] } : { text: '' })

  const updateData = (newData) => {
    setRules({ customSections: { ...(rules.customSections || {}), [section.id]: newData } })
  }

  if (section.sectionType === 'list') {
    const items = data.items || []
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <textarea value={item} onChange={(e) => {
              const next = [...items]
              next[i] = e.target.value
              updateData({ items: next })
            }} rows={1} placeholder="項目を入力"
              className="flex-1 text-sm text-navy bg-navy/3 rounded-lg px-3 py-2 outline-none placeholder:text-navy/25 resize-none" />
            <button type="button" onClick={() => updateData({ items: items.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer mt-2 shrink-0">×</button>
          </div>
        ))}
        <button type="button" onClick={() => updateData({ items: [...items, ''] })}
          className="text-xs font-bold text-navy/50 bg-navy/5 px-4 py-2 rounded-full hover:bg-navy/10 cursor-pointer transition-colors">
          ＋ 項目を追加
        </button>
      </div>
    )
  }

  return (
    <MarkdownField value={data.text || ''} onChange={(v) => updateData({ text: v })}
      placeholder="自由に記述してください" />
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
    const isParseError = error.includes('parse_failed')
    return (
      <div className="p-4 bg-red-50 rounded-xl">
        <p className="text-sm text-red-600 font-bold">
          {isParseError ? 'フィードバックの取得に失敗しました。もう一度お試しください。' : error}
        </p>
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
      {feedback.overall && (
        <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-2">
          <span className="shrink-0">💬</span>
          <p className="text-navy leading-relaxed">{feedback.overall}</p>
        </div>
      )}

      {feedback.issues?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-black text-navy/40 uppercase tracking-widest">指摘事項</h4>
          {feedback.issues.map((issue, i) => {
            const borderClass = issue.type === 'error' ? 'border-l-red-400' : issue.type === 'warning' ? 'border-l-yellow-400' : 'border-l-blue-400'
            const icon = issue.type === 'error' ? '🔴' : issue.type === 'warning' ? '🟡' : '💡'
            return (
              <div key={i} className={`border-l-4 ${borderClass} bg-white rounded-lg p-3 pl-4`}>
                <p className="font-bold text-navy flex items-center gap-1.5">
                  <span className="text-xs">{icon}</span>
                  {issue.title}
                </p>
                {issue.fix && <p className="text-sm text-gray-600 mt-1">{issue.fix}</p>}
              </div>
            )
          })}
        </div>
      )}

      {feedback.strengths?.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-black text-navy/40 uppercase tracking-widest">良い点</h4>
          {feedback.strengths.slice(0, 2).map((s, i) => (
            <p key={i} className="text-green-600 flex items-start gap-1.5">
              <span className="shrink-0">✅</span>
              <span>{s}</span>
            </p>
          ))}
        </div>
      )}

      {feedback.missing?.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-black text-navy/40 uppercase tracking-widest">まだ書けていない項目</h4>
          {feedback.missing.slice(0, 3).map((m, i) => (
            <p key={i} className="text-sm text-gray-500 flex items-start gap-1.5">
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
  const { template, rules, setTemplate, setRules, setGameTitle, setGenre } = useGameStore()
  const [phase, setPhase] = useState(template ? 'editor' : 'template')
  const [openSections, setOpenSections] = useState(['basic', 'factions', 'phases', 'special'])
  const [feedback, setFeedback] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletedSection, setDeletedSection] = useState(null)

  const sections = rules.sections || [
    { id: 'basic', type: 'default', title: 'ゲームの基本情報', icon: '📋', deletable: false },
    { id: 'factions', type: 'default', title: 'ゲームの目的', icon: '🎯', deletable: false },
    { id: 'phases', type: 'default', title: 'ゲームの流れ', icon: '🔄', deletable: false },
    { id: 'special', type: 'default', title: '特殊ルール・例外', icon: '⚡', deletable: false },
  ]

  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const phaseSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const inputClass = 'w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors'

  const toggleSection = (id) => {
    setOpenSections((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }

  const isCompleted = (id) => (rules.completedSections || []).includes(id)
  const toggleCompleted = (id) => {
    const current = rules.completedSections || []
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    setRules({ completedSections: next })
  }

  // Section management
  const handleSectionDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    setRules({ sections: arrayMove(sections, oldIndex, newIndex) })
  }

  const handleAddSection = (name, sectionType) => {
    const newSection = {
      id: `custom_${uid()}`,
      type: 'custom',
      title: name,
      icon: sectionType === 'list' ? '📋' : '📝',
      deletable: true,
      sectionType,
    }
    setRules({ sections: [...sections, newSection] })
    setOpenSections([...openSections, newSection.id])
    setShowAddModal(false)
  }

  const handleDeleteSection = (id) => {
    const section = sections.find((s) => s.id === id)
    setDeletedSection(section)
    setRules({ sections: sections.filter((s) => s.id !== id) })
    setTimeout(() => setDeletedSection(null), 5000)
  }

  const handleUndoDelete = () => {
    if (!deletedSection) return
    setRules({ sections: [...sections, deletedSection] })
    setDeletedSection(null)
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
  const handlePhaseDragEnd = (event) => {
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

  // Render section content by ID
  const renderSectionContent = (section) => {
    switch (section.id) {
      case 'basic':
        return (
          <>
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">ゲームタイトル</label>
              <input type="text" value={rules.gameTitle || ''} onChange={(e) => setRules({ gameTitle: e.target.value })}
                placeholder="例：ひみつの晩餐会" className={`${inputClass} text-lg font-bold`} />
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
              <MarkdownField value={rules.theme || ''} onChange={(v) => setRules({ theme: v })}
                placeholder="例：プレイヤーそれぞれが秘密を抱えながら会話を楽しむゲーム" />
            </div>
          </>
        )
      case 'factions':
        return (
          <>
            <p className="text-xs text-navy/40">各陣営の勝利条件を設定してください。</p>
            <div className="space-y-2">
              {(rules.factions || []).map((f, i) => (
                <div key={f.id} className="bg-navy/3 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={f.name} onChange={(e) => updateFaction(i, { name: e.target.value })}
                      placeholder="陣営名（例：チームA）"
                      className="flex-1 text-sm font-bold text-navy bg-transparent outline-none placeholder:text-navy/25" />
                    {(rules.factions || []).length > 1 && (
                      <button type="button" onClick={() => removeFaction(i)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer">削除</button>
                    )}
                  </div>
                  <MarkdownField value={f.winCondition} onChange={(v) => updateFaction(i, { winCondition: v })}
                    placeholder="勝利条件（例：ゲーム終了時に最も多くのポイントを持っているチームが勝利）" minHeight={80} />
                </div>
              ))}
            </div>
            <button type="button" onClick={addFaction}
              className="text-xs font-bold text-navy/50 bg-navy/5 px-4 py-2 rounded-full hover:bg-navy/10 cursor-pointer transition-colors">
              ＋ 陣営を追加
            </button>
          </>
        )
      case 'phases':
        return (
          <>
            <p className="text-xs text-navy/40">ターン・フェーズを順番に記述してください。ドラッグで並び替えできます。</p>
            <DndContext sensors={phaseSensors} collisionDetection={closestCenter} onDragEnd={handlePhaseDragEnd}>
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
          </>
        )
      case 'special':
        return (
          <>
            <p className="text-xs text-navy/40">特殊能力や例外ルールを追加できます。</p>
            <div className="space-y-2">
              {(rules.specialRules || []).map((r, i) => (
                <div key={r.id} className="bg-navy/3 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={r.title} onChange={(e) => updateSpecialRule(i, { title: e.target.value })}
                      placeholder="ルール名（例：スキップルール）"
                      className="flex-1 text-sm font-bold text-navy bg-transparent outline-none placeholder:text-navy/25" />
                    {(rules.specialRules || []).length > 1 && (
                      <button type="button" onClick={() => removeSpecialRule(i)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer">削除</button>
                    )}
                  </div>
                  <MarkdownField value={r.description} onChange={(v) => updateSpecialRule(i, { description: v })}
                    placeholder="例：手札が0枚になったプレイヤーは次のターンをスキップする" minHeight={80} />
                </div>
              ))}
            </div>
            <button type="button" onClick={addSpecialRule}
              className="text-xs font-bold text-navy/50 bg-navy/5 px-4 py-2 rounded-full hover:bg-navy/10 cursor-pointer transition-colors">
              ＋ ルールを追加
            </button>
          </>
        )
      default:
        // Custom section
        if (section.type === 'custom') {
          return <CustomSectionContent section={section} rules={rules} setRules={setRules} />
        }
        return null
    }
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
              onClick={() => {
                setTemplate(t.key)
                // Keep genre coherent when entering without picking one on Home
                if (t.key === 'coop') setGenre('coop')
                setPhase('editor')
              }}
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
          <DndContext sensors={sectionSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section) => (
                <SortableSection key={section.id} section={section} onDelete={() => handleDeleteSection(section.id)}>
                  {({ dragHandleProps, onDelete }) => (
                    <Section
                      title={section.title}
                      icon={section.icon}
                      open={openSections.includes(section.id)}
                      onToggle={() => toggleSection(section.id)}
                      completed={isCompleted(section.id)}
                      onComplete={() => toggleCompleted(section.id)}
                      dragHandleProps={dragHandleProps}
                      onDelete={onDelete}
                    >
                      {renderSectionContent(section)}
                    </Section>
                  )}
                </SortableSection>
              ))}
            </SortableContext>
          </DndContext>

          {/* Add section button */}
          <button type="button" onClick={() => setShowAddModal(true)}
            className="w-full border-2 border-dashed border-navy/15 rounded-2xl py-4 text-sm font-bold text-navy/40 hover:border-navy/30 hover:text-navy/60 cursor-pointer transition-colors">
            ＋ セクションを追加
          </button>

          {/* Undo delete toast */}
          {deletedSection && (
            <div className="flex items-center justify-between bg-navy/10 rounded-xl px-4 py-3">
              <span className="text-sm text-navy">「{deletedSection.title}」を削除しました</span>
              <button type="button" onClick={handleUndoDelete}
                className="text-sm font-bold text-navy underline cursor-pointer">元に戻す</button>
            </div>
          )}

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

      {/* Add Section Modal */}
      {showAddModal && (
        <AddSectionModal onAdd={handleAddSection} onCancel={() => setShowAddModal(false)} />
      )}
    </PageShell>
  )
}
