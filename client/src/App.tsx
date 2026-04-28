import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import LobbyPage from './pages/LobbyPage'
import ResultPage from './pages/ResultPage'
import JoinLobbyCodePage from './pages/JoinLobbyCodePage'
import JoinLobbyNamePage from './pages/JoinLobbyNamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import { type ResultOutcome } from './components/ResultBanner'
import { type PlayerStats } from './components/StatsTable'

interface ResultRouteState {
  outcome: ResultOutcome
  playerStats: PlayerStats
  opponentStats: PlayerStats
  duration: string
}

function ResultRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = (location.state as Partial<ResultRouteState> | null) ?? {}

  return (
    <ResultPage
      outcome={routeState.outcome ?? 'victory'}
      playerStats={routeState.playerStats ?? { wpm: 120, accuracy: 95 }}
      opponentStats={routeState.opponentStats ?? { wpm: 110, accuracy: 85 }}
      duration={routeState.duration ?? '0:21'}
      onPlayAgain={() => navigate('/lobby')}
      onMainMenu={() => navigate('/')}
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
        <Route path="/join" element={<JoinLobbyCodePage />} />
        <Route path="/join/name" element={<JoinLobbyNamePage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/result" element={<ResultRoute />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App