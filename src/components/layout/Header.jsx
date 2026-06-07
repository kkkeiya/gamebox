import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="flex items-center gap-2 px-5 py-4">
      <Link to="/" className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-accent-warm" />
        <span className="text-lg font-extrabold text-navy tracking-tight">GameBox</span>
      </Link>
    </header>
  )
}
