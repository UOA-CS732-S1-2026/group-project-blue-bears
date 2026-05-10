import React from "react";
import ResultBanner, { type ResultOutcome } from "../components/ResultBanner.tsx";
import StatsTable, { type PlayerStats } from "../components/StatsTable.tsx";
import ActionButtons from "../components/ActionButtons.tsx";
import "./ResultPage.css";

interface PlayerStatus {
  userId: string;
  displayName: string;
  readyForRematch: boolean;
  left: boolean;
}

interface ResultPageProps {
  outcome: ResultOutcome;
  playerStats: PlayerStats;
  opponentStats: PlayerStats;
  duration: string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  playerStatuses?: PlayerStatus[];
  currentUserId?: string;
}

const ResultPage: React.FC<ResultPageProps> = ({
  outcome,
  playerStats,
  opponentStats,
  duration,
  onPlayAgain,
  onMainMenu,
  playerStatuses = [],
  currentUserId = "",
}) => {
  // Find current player and opponent status
  const currentPlayerStatus = playerStatuses.find(
    (p) => p.userId === currentUserId
  );
  const opponentStatus = playerStatuses.find(
    (p) => p.userId !== currentUserId
  );

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

        {/* Player Status Display */}
        {playerStatuses.length > 0 && (
          <div className="result-screen__player-status">
            <div className="player-status-container">
              <div className="player-status-item player-status-item--you">
                <span className="player-status-label">You</span>
                <span className="player-status-badge">
                  {currentPlayerStatus?.readyForRematch ? (
                    <span className="status-badge status-badge--ready">
                      ✓ Ready
                    </span>
                  ) : currentPlayerStatus?.left ? (
                    <span className="status-badge status-badge--left">
                      Left
                    </span>
                  ) : (
                    <span className="status-badge status-badge--waiting">
                      Deciding...
                    </span>
                  )}
                </span>
              </div>

              <div className="player-status-divider">vs</div>

              <div className="player-status-item player-status-item--opponent">
                <span className="player-status-label">Opponent</span>
                <span className="player-status-badge">
                  {opponentStatus?.readyForRematch ? (
                    <span className="status-badge status-badge--ready">
                      ✓ Ready
                    </span>
                  ) : opponentStatus?.left ? (
                    <span className="status-badge status-badge--left">
                      Left
                    </span>
                  ) : (
                    <span className="status-badge status-badge--waiting">
                      Waiting...
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        <ActionButtons 
          onPlayAgain={onPlayAgain} 
          onMainMenu={onMainMenu}
          isPlayerReady={currentPlayerStatus?.readyForRematch ?? false}
          isOpponentReady={opponentStatus?.readyForRematch ?? false}
          hasOpponentLeft={opponentStatus?.left ?? false}
        />
      </main>
    </div>
  );
};

export default ResultPage;