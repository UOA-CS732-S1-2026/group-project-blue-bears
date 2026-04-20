import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import LobbyPage from './pages/LobbyPage'
import ProfileMatchHistoryPage from './pages/ProfileMatchHistoryPage'
import ResultPage from './pages/ResultPage'

function ResultRoute() {
  const navigate = useNavigate()

  return (
    <ResultPage
      outcome="victory"
      playerStats={{ wpm: 120, accuracy: 95 }}
      opponentStats={{ wpm: 110, accuracy: 85 }}
      duration="0:21"
      onPlayAgain={() => {}}
      onMainMenu={() => navigate('/login')}
    />
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/result" element={<ResultRoute />} />
        <Route path="/profile&match_history" element={<ProfileMatchHistoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
