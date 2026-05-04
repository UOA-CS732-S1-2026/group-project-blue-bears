import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import './AuthPages.css'
import './JoinLobbyPage.css'

function JoinLobbyCodePage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  // TODO: checker if the code is valid
  const handleJoin = () => {
    if (!code.trim()) return

    navigate('/lobby', { state: { code } })
  }

  return (
    <div className="auth-root">
      <AuthHeader />

      <main className="auth-main">
        <div className="join-card">
          <input
            className="join-input"
            type="text"
            placeholder="ENTER CODE"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
            spellCheck={false}
          />
          <button className="join-btn" onClick={handleJoin}>
            JOIN
          </button>
        </div>
      </main>

      <footer className="footer" />
    </div>
  )
}

export default JoinLobbyCodePage