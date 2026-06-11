import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { exportGameData } from '../lib/exportJson'
import { projectStorage } from '../lib/projectStorage'
import { generateCardPdf } from '../lib/generatePdf'
import { generateRulebook } from '../lib/generateRulebook'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'

export default function ExportPage() {
  const navigate = useNavigate()
  const store = useGameStore()
  const data = exportGameData(store)
  const jsonString = JSON.stringify(data, null, 2)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [rbLoading, setRbLoading] = useState(false)
  const [rbError, setRbError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [exported, setExported] = useState(false)

  const cardTypes = useMemo(() => ['all', ...new Set(store.cards.map((c) => c.name))], [store.cards])
  const filteredCards = filter === 'all' ? store.cards : store.cards.filter((c) => c.name === filter)

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${store.gameTitle || 'gamebox'}-order.json`
    a.click()
    URL.revokeObjectURL(url)
    // Mark the saved project as complete
    if (store.currentProjectId) {
      projectStorage.save({ id: store.currentProjectId, status: 'complete' })
    }
    setExported(true)
  }

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    setPdfError(null)
    try {
      await generateCardPdf(store.cards, store.cardSpec.size, `${store.gameTitle || 'gamebox'}_cards.pdf`, store.cardSpec.back_design)
    } catch (err) {
      console.error('PDF generation failed:', err)
      setPdfError('PDFの生成に失敗しました。カードにデザインが設定されているか確認してください。')
    } finally { setPdfLoading(false) }
  }

  const handleDownloadRulebook = async () => {
    setRbLoading(true)
    setRbError(null)
    try {
      await generateRulebook(store)
    } catch (err) {
      console.error('Rulebook generation failed:', err)
      setRbError('ルールブックの生成に失敗しました。')
    } finally { setRbLoading(false) }
  }

  const handleReset = () => {
    if (!confirm('いまの作品はマイゲームに保存されています。新しいゲームを作り始めますか？')) return
    store.resetAll()
    navigate('/')
  }

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-black text-navy">発注データ出力</h1>
      <p className="mt-1 text-navy/50 text-sm">カード一覧を確認して、データをダウンロードしてください</p>

      {/* ─── Card Grid ─── */}
      {store.cards.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-black text-navy/40 uppercase tracking-widest">カード一覧</h2>
            <div className="flex gap-1">
              {cardTypes.map((t) => (
                <button key={t} type="button" onClick={() => setFilter(t)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${filter === t ? 'bg-navy text-white' : 'bg-navy/10 text-navy/50 hover:bg-navy/20'}`}>
                  {t === 'all' ? 'すべて' : t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filteredCards.map((card, i) => {
              const d = card.design || {}
              return (
                <div key={card.id || i} className="rounded-xl overflow-hidden flex flex-col items-center justify-between shadow-sm"
                  style={{ aspectRatio: '63/88', background: d.bg_color || '#fff', border: `2px solid ${d.border_color || '#0B1F5C'}` }}>
                  <div className="w-full text-center py-1 px-1" style={{ background: 'rgba(240,244,255,0.5)' }}>
                    <p className="text-[8px] font-black truncate" style={{ color: d.border_color || '#0B1F5C' }}>{d.title_text || card.name}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">{d.icon || card.emoji || '🃏'}</span>
                  </div>
                  <div className="w-full text-center py-1 px-1" style={{ background: 'rgba(240,244,255,0.5)' }}>
                    <p className="text-[7px] text-navy/40 truncate">{d.bottom_text || card.description || ''}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── JSON ─── */}
      <div className="mt-8 bg-navy rounded-2xl p-4 overflow-auto max-h-64">
        <pre className="text-xs text-green-300 whitespace-pre font-mono leading-relaxed">{jsonString}</pre>
      </div>

      {/* ─── Actions ─── */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button onClick={handleDownloadJson} className="flex-1">発注JSONをダウンロード</Button>
        <Button variant="secondary" onClick={handleDownloadPdf} disabled={pdfLoading || store.cards.length === 0} className="flex-1">
          {pdfLoading ? '生成中...' : 'カードPDFをダウンロード'}
        </Button>
      </div>
      {pdfError && <p className="text-red-500 text-sm mt-2">{pdfError}</p>}

      <div className="mt-3">
        <button type="button" onClick={handleDownloadRulebook} disabled={rbLoading}
          className="w-full rounded-full bg-navy text-white font-bold py-3.5 text-base hover:bg-navy/90 transition-colors cursor-pointer disabled:opacity-50">
          {rbLoading ? '生成中...' : '📖 ルールブックをダウンロード'}
        </button>
        {rbError && <p className="text-red-500 text-sm mt-2">{rbError}</p>}
        {!store.rulebook?.include && (
          <p className="text-xs text-navy/40 mt-2 text-center">
            ※見積もりにはルールブック印刷が含まれていません（PDFプレビューは無料です）
          </p>
        )}
      </div>

      {/* ─── Completion banner ─── */}
      {exported && (
        <div className="mt-6 bg-accent/20 border-2 border-accent rounded-2xl p-5 text-center">
          <p className="text-2xl">🎉</p>
          <p className="mt-1 font-black text-navy">発注データを出力しました！</p>
          <p className="mt-1 text-sm text-navy/60">この作品はマイゲームで「完成」として保存されています。</p>
          <button type="button" onClick={() => navigate('/projects')}
            className="mt-4 bg-navy text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-navy/90 transition-colors cursor-pointer">
            マイゲーム一覧を見る →
          </button>
        </div>
      )}

      <button type="button" onClick={handleReset}
        className="mt-4 w-full rounded-full border-2 border-navy/15 text-navy font-bold py-3.5 text-base hover:bg-navy/5 transition-colors cursor-pointer">
        最初からやり直す
      </button>
    </PageShell>
  )
}
