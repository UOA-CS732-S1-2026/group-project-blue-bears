import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader';
import MenuItem from '../components/MenuItem';
import './AuthPages.css'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const [flashMessage, setFlashMessage] = useState('')

  useEffect(() => {
    const msg = sessionStorage.getItem('flash')
    if (msg) {
      sessionStorage.removeItem('flash')
      setFlashMessage(msg)
    }
  }, [])

  return (
    <div className="auth-root">
      <AuthHeader showAuth={true} />

      {flashMessage && (
        <p style={{ color: '#f5a623', textAlign: 'center', fontFamily: 'monospace', margin: '0.5rem 0' }}>
          {flashMessage}
        </p>
      )}

      <div className="menu-container">
        <MenuItem name="CREATE LOBBY" onClick={() => navigate('/lobby')} />
        <MenuItem name="JOIN LOBBY" onClick={() => navigate('/join')} />
        <MenuItem name="PROFILE" onClick={() => navigate('/profile')} />
        <MenuItem name="LEADERBOARD" onClick={() => navigate('/leaderboard')} />
      </div>

      <footer className="footer" />
    </div>
  )
}

export default LandingPage;