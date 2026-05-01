import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader';
import MenuItem from '../components/MenuItem';
import './AuthPages.css'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="auth-root">
      <AuthHeader showAuth={true} />

      <div className="menu-container">
        <MenuItem name="CREATE LOBBY" onClick={() => navigate('/lobby')} />
        <MenuItem name="JOIN LOBBY" onClick={() => navigate('/join')} />
        <MenuItem name="LEADERBOARD" onClick={() => navigate('/leaderboard')} />
        <MenuItem name="SETTINGS" />
        <MenuItem name="PROFILE" onClick={() => navigate('/profile')} />
        <MenuItem name="MATCH HISTORY" />
      </div>

      <footer className="footer" />
    </div>
  )
}

export default LandingPage;