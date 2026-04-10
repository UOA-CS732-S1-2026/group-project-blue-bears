import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import ResultPage from './pages/ResultPage'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/result" element={<ResultPage outcome="victory" playerStats={{ wpm: 120, accuracy: 95 }} opponentStats={{ wpm: 110, accuracy: 85 }} duration="0:21" onPlayAgain={() => {}} onMainMenu={() => {}} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App