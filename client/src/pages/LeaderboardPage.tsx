import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import LeaderboardRow, { type Player, type FilterType } from '../components/LeaderboardRow'
import { getLeaderboard } from '../services/leaderboardService'
import './LeaderboardPage.css'

function LeaderboardPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('AVG WPM')
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')

    if (!token) {
      navigate('/login', {
        state: {
          title: 'Sign In',
          subtitle: 'Log in to view the leaderboard.',
        },
      })
      return
    }

    const fetchData = async () => {
      try {
        const entries = await getLeaderboard(token)
        setPlayers(
          entries.map(e => ({
            userId: e.userId,
            name: e.username,
            avgWpm: e.avgWpm,
            accuracy: e.avgAccuracy,
            wins: e.totalWins,
            totalMatch: e.totalMatches,
            isMe: e.userId === userId,
          }))
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [navigate])

  const sorted = [...players].sort((a, b) => {
    if (filter === 'AVG WPM') return (b.avgWpm - a.avgWpm) || (b.accuracy - a.accuracy) || (b.wins - a.wins)
    if (filter === 'ACCURACY') return (b.accuracy - a.accuracy) || (b.avgWpm - a.avgWpm) || (b.wins - a.wins)
    if (filter === 'WINS') return (b.wins - a.wins) || (b.avgWpm - a.avgWpm) || (b.accuracy - a.accuracy)
    return 0
  })


  const meIndex = sorted.findIndex(p => p.isMe)
  const meRow = meIndex !== -1 ? sorted[meIndex] : null

  if (loading) {
    return (
      <div className="lb-root">
        <AuthHeader center="GLOBAL LEADERBOARD" back={() => navigate('/')} />
        <div className="profile-loading">LOADING...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="lb-root">
        <AuthHeader center="GLOBAL LEADERBOARD" back={() => navigate('/')} />
        <div className="profile-loading">{error}</div>
      </div>
    )
  }

  return (
    <div className="lb-root">
      <AuthHeader
        center="GLOBAL LEADERBOARD"
        back={() => navigate('/')}
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
              <LeaderboardRow key={player.userId} player={player} rank={i + 1} activeFilter={filter} />
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
