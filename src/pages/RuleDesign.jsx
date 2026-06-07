import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const playtimeOptions = [5, 15, 30, 60]

const inputClass =
  'w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors'

export default function RuleDesign() {
  const navigate = useNavigate()
  const { gameTitle, rules, setGameTitle, setRules } = useGameStore()
  const [title, setTitle] = useState(gameTitle)
  const [players, setPlayers] = useState(rules.players || 4)
  const [playtime, setPlaytime] = useState(rules.playtime || 15)
  const [winCondition, setWinCondition] = useState(rules.winCondition || '')

  const handleNext = () => {
    setGameTitle(title)
    setRules({ players, playtime, winCondition })
    navigate('/cards')
  }

  return (
    <PageShell>
      <h1 className="text-2xl md:text-3xl font-black text-navy">ルール設計</h1>
      <p className="mt-1 text-navy/50 text-sm">ゲームの基本ルールを決めましょう</p>

      <Card className="mt-8 p-6 space-y-6">
        {/* Game Title */}
        <div>
          <label className="block text-sm font-bold text-navy mb-1.5">ゲームタイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：人狼カードゲーム"
            className={inputClass}
          />
        </div>

        {/* Player Count */}
        <div>
          <label className="block text-sm font-bold text-navy mb-1.5">
            プレイ人数: <span className="text-accent-warm font-extrabold">{players}人</span>
          </label>
          <input
            type="range"
            min={2}
            max={10}
            value={players}
            onChange={(e) => setPlayers(Number(e.target.value))}
            className="w-full accent-navy"
          />
          <div className="flex justify-between text-xs text-navy/40 mt-1">
            <span>2人</span>
            <span>10人</span>
          </div>
        </div>

        {/* Play Time */}
        <div>
          <label className="block text-sm font-bold text-navy mb-2">プレイ時間</label>
          <div className="grid grid-cols-4 gap-2">
            {playtimeOptions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPlaytime(t)}
                className={`rounded-full py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  playtime === t
                    ? 'bg-navy text-white'
                    : 'bg-white border-2 border-blue-200 text-navy/60 hover:border-navy/30'
                }`}
              >
                {t}分
              </button>
            ))}
          </div>
        </div>

        {/* Win Condition */}
        <div>
          <label className="block text-sm font-bold text-navy mb-1.5">勝利条件</label>
          <textarea
            value={winCondition}
            onChange={(e) => setWinCondition(e.target.value)}
            placeholder="例：最後まで生き残ったプレイヤーが勝利"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      </Card>

      <Button onClick={handleNext} className="mt-10 w-full">
        次へ →
      </Button>
    </PageShell>
  )
}
