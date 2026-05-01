import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TypingDisplay from "../components/TypingDisplay";
import { useGameLogic, formatTime } from "../hooks/useGameLogic";
import "./GamePage.css";

const PASSAGE =
  "The journey of a thousand miles begins with a single step. Similarly, mastering typing starts with learning proper finger placement on the keyboard.";

const TOTAL_SECONDS = 60;

// Simulated opponent - swap out for real data when backend is ready
const MOCK_OPPONENT_STATS = {
  wpm: 64,
  accuracy: 98,
  inaccuracies: 2,
};

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const { userInput, status, timeLeft, stats, handleInput } = useGameLogic({
    passage: PASSAGE,
    totalSeconds: TOTAL_SECONDS,
    onGameEnd: (finalStats: typeof MOCK_OPPONENT_STATS, elapsed: number) => {
      const opponent = MOCK_OPPONENT_STATS;

      let outcome: "victory" | "defeat" | "draw" = "draw";
      if (finalStats.wpm > opponent.wpm) outcome = "victory";
      else if (finalStats.wpm < opponent.wpm) outcome = "defeat";

      navigate("/result", {
        state: {
          outcome,
          playerStats: finalStats,
          opponentStats: opponent,
          duration: formatTime(elapsed),
        },
      });
    },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInput(e.target.value);
  };

  const handlePageClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="game-page" onClick={handlePageClick}>
      <input
        ref={inputRef}
        value={userInput}
        onChange={handleChange}
        className="game-page__hidden-input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        disabled={status === "finished"}
        autoFocus
      />

      {/* HUD - 1v1 Layout */}
      <div className="game-page__hud">
        {/* Player Stats */}
        <div className="game-page__player-card game-page__player-card--you">
          <div className="game-page__card-header">You</div>
          <div className="game-page__card-stats">
            <div className="game-page__stat-item">
              <span className="game-page__stat-label">WPM</span>
              <span className="game-page__stat-value">{stats.wpm}</span>
            </div>
            <div className="game-page__stat-item">
              <span className="game-page__stat-label">Accuracy</span>
              <span className="game-page__stat-value">{stats.accuracy}%</span>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="game-page__timer">
          {status === "idle" ? (
            <span className="game-page__timer-idle">Start typing...</span>
          ) : (
            <span
              className={`game-page__timer-value ${
                timeLeft <= 5 ? "game-page__timer-value--urgent" : ""
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          )}
        </div>

        {/* Opponent Stats */}
        <div className="game-page__player-card game-page__player-card--them">
          <div className="game-page__card-header">Them</div>
          <div className="game-page__card-stats">
            <div className="game-page__stat-item">
              <span className="game-page__stat-label">WPM</span>
              <span className="game-page__stat-value">{MOCK_OPPONENT_STATS.wpm}</span>
            </div>
            <div className="game-page__stat-item">
              <span className="game-page__stat-label">Accuracy</span>
              <span className="game-page__stat-value">{MOCK_OPPONENT_STATS.accuracy}%</span>
            </div>
          </div>
        </div>
      </div>

      <TypingDisplay passage={PASSAGE} userInput={userInput} />

      <div className="game-page__inaccuracies">
        Inaccuracies: <span>{stats.inaccuracies}</span>
      </div>
    </div>
  );
};

export default GamePage;