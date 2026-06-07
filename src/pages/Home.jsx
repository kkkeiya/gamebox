import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

const genres = [
  {
    key: 'party',
    emoji: '🎭',
    title: 'パーティーゲーム',
    description: '正体を隠したり、言葉で騙したり',
    cardClass: 'bg-navy text-white',
  },
  {
    key: 'coop',
    emoji: '🤝',
    title: '協力ゲーム',
    description: '全員で協力してゴールを目指す',
    cardClass: 'bg-accent text-navy',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const setGenre = useGameStore((s) => s.setGenre)

  const handleSelect = (genre) => {
    setGenre(genre)
    navigate('/rules')
  }

  return (
    <div className="min-h-screen bg-bg dot-pattern font-sans">
      {/* Header */}
      <header className="px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-accent" />
          <span className="text-xl font-extrabold text-navy tracking-tight">
            GameBox
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <h1 className="text-3xl md:text-5xl font-extrabold text-navy text-center leading-tight">
          頭の中のゲームを、この世に出そう
        </h1>
        <p className="mt-4 text-base md:text-lg text-navy/60 text-center max-w-md">
          アイデアさえあれば大丈夫。ステップに沿って進めるだけです。
        </p>

        {/* Genre Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {genres.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => handleSelect(g.key)}
              className={`${g.cardClass} rounded-2xl p-8 text-left cursor-pointer transition-all duration-200 hover:-translate-y-2 hover:shadow-xl`}
            >
              <span className="text-4xl">{g.emoji}</span>
              <h2 className="mt-4 text-xl font-bold">{g.title}</h2>
              <p className="mt-2 text-sm opacity-80">{g.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
