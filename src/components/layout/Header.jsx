import { Link, useLocation } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'

export default function Header() {
  const location = useLocation()
  const gameTitle = useGameStore((s) => s.gameTitle || s.rules?.gameTitle)
  const isEditorPage = ['/rules', '/cards', '/cards/edit', '/order', '/export'].includes(location.pathname)

  return (
    <header className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        {isEditorPage && (
          <Link to="/projects" className="text-xs font-bold text-navy/40 hover:text-navy transition-colors">
            ← マイゲーム
          </Link>
        )}
        <Link to="/projects" className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-accent-warm" />
          <span className="text-lg font-extrabold text-navy tracking-tight">GameBox</span>
        </Link>
      </div>
      {isEditorPage && (
        <span className="text-sm font-bold text-navy/40 truncate max-w-[200px]">
          {gameTitle || '無題のゲーム'}
        </span>
      )}
    </header>
  )
}
