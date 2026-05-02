import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import { getProfile, getMatchHistory, type ProfileData, type Match } from '../services/profileService'
import './ProfilePage.css'

function formatDate(iso: string) {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function ProfilePage() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const userId = localStorage.getItem('userId')

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !userId) {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      try {
        const [profileData, historyData] = await Promise.all([
          getProfile(token),
          getMatchHistory(token, 1, 20),
        ])
        setProfile(profileData)
        setMatches(historyData.matches)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token, userId, navigate])

  if (!token || !userId) return null

  if (loading) {
    return (
      <div className="profile-root">
        <AuthHeader center="PROFILE" exit={() => navigate('/')} />
        <div className="profile-loading">LOADING...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="profile-root">
        <AuthHeader center="PROFILE" exit={() => navigate('/')} />
        <div className="profile-loading">{error ?? 'Profile not found'}</div>
      </div>
    )
  }

  const losses = profile.totalMatches - profile.totalWins
  const winRate = profile.totalMatches > 0
    ? Math.round((profile.totalWins / profile.totalMatches) * 100)
    : 0
  const initials = profile.username.slice(0, 2).toUpperCase()

  return (
    <div className="profile-root">
      <AuthHeader center={`PROFILE: ${profile.username}`} exit={() => navigate('/')} />

      <main className="profile-main">
        {/* Left: profile card */}
        <section className="profile-card">
          <div className="profile-avatar">{initials}</div>

          <div className="profile-info">
            <span className="profile-username">{profile.username}</span>
          </div>

          <div className="profile-wl-row">
            <div className="profile-wl-box">
              <span className="profile-wl-label">Wins</span>
              <span className="profile-wl-value profile-wl-value--wins">{profile.totalWins}</span>
            </div>
            <div className="profile-wl-box">
              <span className="profile-wl-label">Losses</span>
              <span className="profile-wl-value profile-wl-value--losses">{losses}</span>
            </div>
          </div>

          <div className="profile-total-row">
            <span className="profile-total-label">Total Matches</span>
            <span className="profile-total-value">{profile.totalMatches}</span>
          </div>

          <div className="profile-stats-grid">
            <div className="profile-stat">
              <span className="profile-stat-label">Win Rate</span>
              <span className="profile-stat-value">{winRate}%</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Avg WPM</span>
              <span className="profile-stat-value">{profile.avgWpm}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Accuracy</span>
              <span className="profile-stat-value">{profile.avgAccuracy}%</span>
            </div>
          </div>
        </section>

        {/* Right: match history */}
        <section className="profile-history">
          <h2 className="profile-history-title">MATCH HISTORY</h2>
          <div className="profile-history-list">
            {matches.length === 0 && (
              <div className="profile-history-empty">No matches yet</div>
            )}
            {matches.map((match) => {
              const isPlayer1 = match.player1.userId === userId
              const me = isPlayer1 ? match.player1 : match.player2
              const opponent = isPlayer1 ? match.player2 : match.player1
              const isWin = match.winnerId === userId

              return (
                <div key={match._id} className="profile-history-row">
                  <span className={`profile-result-tag ${isWin ? 'profile-result-tag--win' : 'profile-result-tag--loss'}`}>
                    [ {isWin ? 'WIN' : 'LOSS'} ]
                  </span>
                  <span className="profile-history-vs">vs {opponent.username}</span>
                  <span className="profile-history-wpm">{me.wpm} WPM</span>
                  <span className="profile-history-acc">Accuracy {me.accuracy}%</span>
                  <span className="profile-history-date">{formatDate(match.createdAt)}</span>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <footer className="footer" />
    </div>
  )
}

export default ProfilePage
