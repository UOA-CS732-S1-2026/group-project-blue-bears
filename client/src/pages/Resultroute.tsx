import { useLocation, useNavigate } from "react-router-dom";
import ResultPage from "./ResultPage";
import type { GameStats } from "../hooks/useGameLogic";

interface ResultState {
  outcome: "victory" | "defeat" | "draw";
  playerStats: GameStats;
  opponentStats: GameStats;
  duration: string;
}

function ResultRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | null;

  // Fallback if someone navigates directly to /result without game data
  if (!state) {
    return (
      <div style={{ color: "#fff", textAlign: "center", marginTop: "20vh", fontFamily: "monospace" }}>
        No game data found.{" "}
        <button onClick={() => navigate("/")} style={{ color: "#f5a623", background: "none", border: "none", cursor: "pointer", fontFamily: "monospace" }}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <ResultPage
      outcome={state.outcome}
      playerStats={state.playerStats}
      opponentStats={state.opponentStats}
      duration={state.duration}
      onPlayAgain={() => navigate("/lobby")}
      onMainMenu={() => navigate("/")}
    />
  );
}

export default ResultRoute;