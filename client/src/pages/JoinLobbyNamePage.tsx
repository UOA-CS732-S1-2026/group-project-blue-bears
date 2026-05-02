import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import './AuthPages.css'
import './JoinLobbyPage.css'

function JoinLobbyNamePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const code = (location.state as { code?: string })?.code ?? ''
  const [name, setName] = useState('')

  const handleGo = () => {
    if (!name.trim()) return
    navigate('/lobby', { state: { code, guestName: name } })
  }

  return (
    <div className="auth-root">
      <AuthHeader back={() => navigate('/join')}/>

      <main className="auth-main">
        <div className="join-card">
          <input
            className="join-input"
            type="text"
            placeholder="ENTER NAME"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGo()}
            autoFocus
            spellCheck={false}
          />
          <button className="join-btn" onClick={handleGo}>
            GO
          </button>
        </div>
      </main>

      <footer className="footer" />
    </div>
  )
}

export default JoinLobbyNamePage
