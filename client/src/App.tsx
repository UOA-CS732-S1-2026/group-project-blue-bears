import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import LobbyPage from './pages/LobbyPage'
import JoinLobbyCodePage from './pages/JoinLobbyCodePage'
import JoinLobbyNamePage from './pages/JoinLobbyNamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import GameGraphicsTestPage from './pages/GameGraphicsTestPage'
import { type ResultOutcome } from './components/ResultBanner'
import { type PlayerStats } from './components/StatsTable'
import GamePage from './pages/GamePage'
import ResultRoute from "./pages/Resultroute";

interface ResultRouteState {
  outcome: ResultOutcome
  playerStats: PlayerStats
  opponentStats: PlayerStats
  duration: string
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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/testing" element={<GameGraphicsTestPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
