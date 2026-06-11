import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { projectStorage } from '../lib/projectStorage'
import Header from '../components/layout/Header'

export default function Projects() {
  const navigate = useNavigate()
  const { resetAll, loadProject, setCurrentProjectId } = useGameStore()
  const [projects, setProjects] = useState(() => projectStorage.getAll())
  const [contextMenu, setContextMenu] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleNewProject = () => {
    resetAll()
    const project = projectStorage.save({
      genre: 'party',
      gameTitle: '',
      template: '',
      rules: {},
      cards: [],
      cardSpec: { size: 'poker', surface: 'none', sets: 1, back_design: { style: 'simple', color: '#0B1F5C' } },
      rulebook: { include: true, pages: 4 },
      status: 'draft',
      totalCards: 0,
    })
    setCurrentProjectId(project.id)
    navigate('/rules')
  }

  const handleOpenProject = (project) => {
    loadProject(project)
    navigate('/rules')
  }

  const handleContextMenu = (e, project) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, project })
  }

  const handleDuplicate = (id) => {
    projectStorage.duplicate(id)
    setProjects(projectStorage.getAll())
    setContextMenu(null)
  }

  const handleDelete = (id) => {
    if (!confirm('このゲームを削除しますか？')) return
    projectStorage.delete(id)
    setProjects(projectStorage.getAll())
    setContextMenu(null)
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  return (
    <div className="min-h-screen bg-bg dot-pattern-hero font-sans">
      <Header />
      <main className="max-w-[900px] mx-auto px-5 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[28px] font-black text-navy">マイゲーム</h1>
          <button type="button" onClick={handleNewProject}
            className="bg-navy text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-navy/90 transition-colors cursor-pointer">
            ＋ 新しいゲームを作る
          </button>
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-6xl mb-4">🎮</span>
            <p className="font-bold text-navy text-lg">まだゲームがありません</p>
            <p className="text-gray-500 text-sm mt-1">最初のゲームを作ってみましょう</p>
            <button type="button" onClick={handleNewProject}
              className="mt-6 bg-navy text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-navy/90 transition-colors cursor-pointer">
              ＋ ゲームを作る
            </button>
          </div>
        )}

        {/* Gallery Grid */}
        {projects.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {projects.map((project) => {
              const firstCard = project.cards?.[0]
              const cardImage = firstCard?.design?.image_url
              const genreEmoji = project.genre === 'coop' ? '🤝' : '🎭'

              return (
                <div key={project.id}
                  onClick={() => handleOpenProject(project)}
                  onContextMenu={(e) => handleContextMenu(e, project)}
                  className="bg-white rounded-2xl border-2 border-[#D0DAEF] shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:border-navy hover:shadow-md overflow-hidden">
                  {/* Preview area */}
                  <div className="relative bg-[#EBF1FF] flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                    {cardImage ? (
                      <img src={cardImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">{genreEmoji}</span>
                    )}
                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      project.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {project.status === 'complete' ? '完成' : '下書き'}
                    </span>
                  </div>

                  {/* Info area */}
                  <div className="p-3">
                    <p className="font-bold text-navy text-sm truncate">{project.gameTitle || project.rules?.gameTitle || '無題のゲーム'}</p>
                    <p className="text-xs text-[#8A96B0] mt-1">{formatDate(project.createdAt || project.updatedAt)}</p>
                    <p className="text-xs text-[#8A96B0]">カード {project.totalCards || 0}枚</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div ref={menuRef} className="fixed z-50 bg-white rounded-xl shadow-lg border border-navy/10 py-1 min-w-[140px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}>
            <button type="button" onClick={() => { handleOpenProject(contextMenu.project); setContextMenu(null) }}
              className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-navy/5 cursor-pointer">編集する</button>
            <button type="button" onClick={() => handleDuplicate(contextMenu.project.id)}
              className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-navy/5 cursor-pointer">複製する</button>
            <button type="button" onClick={() => handleDelete(contextMenu.project.id)}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer">削除する</button>
          </div>
        )}
      </main>
    </div>
  )
}
