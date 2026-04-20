import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import LeaderboardRow, { type Player, type FilterType } from '../components/LeaderboardRow'
import './LeaderboardPage.css'

const PLAYERS: Player[] = [
  { name: 'A', code: '#0001', avgWpm: 155, accuracy: 98, wins: 512, totalMatch: 800 },
  { name: 'B', code: '#0002', avgWpm: 150, accuracy: 97, wins: 412, totalMatch: 800 },
  { name: 'C', code: '#0003', avgWpm: 145, accuracy: 95, wins: 311, totalMatch: 800 },
  { name: 'D', code: '#0004', avgWpm: 140, accuracy: 96, wins: 516, totalMatch: 800 },
  { name: 'E', code: '#0005', avgWpm: 135, accuracy: 93, wins: 205, totalMatch: 800 },
  { name: 'F', code: '#0006', avgWpm: 130, accuracy: 94, wins: 518, totalMatch: 800 },
  { name: 'H', code: '#0008', avgWpm: 125, accuracy: 92, wins: 511, totalMatch: 800 },
  { name: 'G', code: '#0007', avgWpm: 120, accuracy: 91, wins: 411, totalMatch: 800 },
  { name: 'Z', code: '#0011', avgWpm: 141, accuracy: 96, wins: 498, totalMatch: 800, isMe: true },
]

function LeaderboardPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('AVG WPM')
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    // TODO: replace with real API call when backend is ready
    setPlayers(PLAYERS)
  }, [])

  const sorted = [...players].sort((a, b) => {
    if (filter === 'AVG WPM') return (b.avgWpm - a.avgWpm) || (b.accuracy - a.accuracy) || (b.wins - a.wins)
    if (filter === 'ACCURACY') return (b.accuracy - a.accuracy) || (b.avgWpm - a.avgWpm) || (b.wins - a.wins)
    if (filter === 'WINS') return (b.wins - a.wins) || (b.avgWpm - a.avgWpm) || (b.accuracy - a.accuracy)
    return 0
  })


  const meIndex = sorted.findIndex(p => p.isMe)
  const meRow = meIndex !== -1 ? sorted[meIndex] : null

  return (
    <div className="lb-root">
      <AuthHeader
        center="GLOBAL LEADERBOARD"
        exit={() => navigate('/')}
      />

      <main className="lb-main">

        {/* Filter bar */}
        <div className="lb-filter-bar">
          <span className="lb-filter-label">Filter by</span>
          {(['AVG WPM', 'ACCURACY', 'WINS'] as FilterType[]).map(f => (
            <button
              key={f}
              className={`lb-filter-btn ${filter === f ? 'lb-filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              [ {f} ]
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="lb-table-wrapper">

          {/* Column headers */}
          <div className="lb-table-header">
            <span className="lb-col lb-col--player">[ Player ]</span>
            <span className={`lb-col lb-col--wpm ${filter === 'AVG WPM' ? 'lb-filter-btn--active' : ''}`}>[ AVG WPM ]</span>
            <span className={`lb-col lb-col--accuracy ${filter === 'ACCURACY' ? 'lb-filter-btn--active' : ''}`}>[ ACCURACY ]</span>
            <span className={`lb-col lb-col--wins ${filter === 'WINS' ? 'lb-filter-btn--active' : ''}`}>[ WINS ]</span>
            <span className="lb-col lb-col--total">[ TOTAL MATCH ]</span>
          </div>

          {/* Scrollable rows — all players in sorted order, player row highlighted in list */}
          <div className="lb-table-scroll">
            {sorted.map((player, i) => (
              <LeaderboardRow key={player.code} player={player} rank={i + 1} activeFilter={filter} />
            ))}
          </div>

          {/* Player row — always pinned below the list regardless of scroll position */}
          {meRow && (
            <div className="lb-me-pinned">
              <LeaderboardRow player={meRow} rank={meIndex + 1} activeFilter={filter} />
            </div>
          )}

        </div>
      </main>
      <footer className="footer" />
    </div>
  )
}

export default LeaderboardPage