import React from "react";
import ResultBanner, { type ResultOutcome } from "../components/ResultBanner.tsx";
import StatsTable, { type PlayerStats } from "../components/StatsTable.tsx";
import ActionButtons from "../components/ActionButtons.tsx";
import "./ResultPage.css";

interface ResultPageProps {
  outcome: ResultOutcome;
  playerStats: PlayerStats;
  opponentStats: PlayerStats;
  duration: string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({
  outcome,
  playerStats,
  opponentStats,
  duration,
  onPlayAgain,
  onMainMenu,
}) => {
  return (
    <div className="result-screen">
      {/* Animated grid background */}
      <div className="result-screen__bg" aria-hidden="true">
        <div className="result-screen__grid" />
        <div className="result-screen__vignette" />
      </div>

      <main className="result-screen__card">
        <ResultBanner outcome={outcome} />
        <StatsTable
          playerStats={playerStats}
          opponentStats={opponentStats}
          duration={duration}
        />
        <ActionButtons onPlayAgain={onPlayAgain} onMainMenu={onMainMenu} />
      </main>
    </div>
  );
};

export default ResultPage;