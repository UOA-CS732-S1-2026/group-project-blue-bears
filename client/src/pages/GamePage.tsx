import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TypingDisplay from "../components/TypingDisplay";
import { useGameLogic, formatTime } from "../hooks/useGameLogic";
import socket from "../socket";
import "./GamePage.css";

const PASSAGE =
  "The journey of a thousand miles begins with a single step. Similarly, mastering typing starts with learning proper finger placement on the keyboard.";

const TOTAL_SECONDS = 60;

interface GameLocationState {
  roomId?: string;
  userId?: string;
  username?: string;
  passageText?: string;
  totalSeconds?: number;
  countdownSeconds?: number;
  startAt?: number;
}

interface FinisherResult {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  finished: boolean;
}

// Simulated opponent - swap out for real data when backend is ready
const MOCK_OPPONENT_STATS = {
  wpm: 64,
  accuracy: 98,
  inaccuracies: 2,
};

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const locationState = (location.state as GameLocationState | null) ?? {};
  const raceStartAtRef = useRef(locationState.startAt ?? Date.now() + 3000);
  const raceStartAt = raceStartAtRef.current;
  const raceDuration = locationState.totalSeconds ?? TOTAL_SECONDS;
  const racePassage = locationState.passageText ?? PASSAGE;
  const countdownSeed = locationState.countdownSeconds ?? 3;
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [didStartRace, setDidStartRace] = React.useState(false);
  const [waitingForResults, setWaitingForResults] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const roomId = locationState.roomId;
    const userId = locationState.userId;
    if (!roomId || !userId) return;

    const handleRaceResults = (payload: { roomId: string; results: FinisherResult[] }) => {
      const myResult = payload.results.find(r => r.userId === userId);
      const opponentResult = payload.results.find(r => r.userId !== userId);

      if (!myResult) return;

      let outcome: "victory" | "defeat" | "draw" = "draw";
      if (opponentResult) {
        if (myResult.wpm > opponentResult.wpm) outcome = "victory";
        else if (myResult.wpm < opponentResult.wpm) outcome = "defeat";
      }

      navigate("/result", {
        state: {
          roomId: payload.roomId,
          userId,
          username: locationState.username,
          outcome,
          playerStats: { wpm: myResult.wpm, accuracy: myResult.accuracy, inaccuracies: 0 },
          opponentStats: opponentResult
            ? { wpm: opponentResult.wpm, accuracy: opponentResult.accuracy, inaccuracies: 0 }
            : MOCK_OPPONENT_STATS,
          duration: formatTime(elapsedRef.current),
        },
      });
    };

    socket.on("race_results", handleRaceResults);
    return () => { socket.off("race_results", handleRaceResults); };
  }, [locationState, navigate]);

  const { userInput, status, timeLeft, stats, start, handleInput } = useGameLogic({
    passage: racePassage,
    totalSeconds: raceDuration,
    onGameEnd: (finalStats, elapsed) => {
      elapsedRef.current = elapsed;
      const roomId = locationState.roomId;
      const userId = locationState.userId;

      if (roomId && userId && socket.connected) {
        socket.emit("race_complete", {
          roomId,
          userId,
          wpm: finalStats.wpm,
          accuracy: finalStats.accuracy,
        });
        setWaitingForResults(true);
        return;
      }

      // Solo/practice mode or disconnected: navigate immediately
      const opponent = MOCK_OPPONENT_STATS;
      let outcome: "victory" | "defeat" | "draw" = "draw";
      if (finalStats.wpm > opponent.wpm) outcome = "victory";
      else if (finalStats.wpm < opponent.wpm) outcome = "defeat";

      navigate("/result", {
        state: {
          roomId,
          userId,
          username: locationState.username,
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

  useEffect(() => {
    if (countdown !== null || status !== "playing") {
      return;
    }

    // Wait for the input to become enabled, then focus it immediately at race start.
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [countdown, status]);

  useEffect(() => {
    const tick = () => {
      const msUntilStart = raceStartAt - Date.now();

      if (msUntilStart <= 0) {
        setCountdown(null);
        if (!didStartRace) {
          start(raceStartAt);
          setDidStartRace(true);
        }
        return;
      }

      const secondsLeft = Math.ceil(msUntilStart / 1000);
      setCountdown(Math.min(countdownSeed, Math.max(1, secondsLeft)));
    };

    tick();
    const interval = window.setInterval(tick, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [countdownSeed, didStartRace, raceStartAt, start]);

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
        disabled={status === "finished" || countdown !== null || status !== "playing"}
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
          {countdown !== null ? (
            <span className="game-page__timer-value">{countdown}</span>
          ) : waitingForResults ? (
            <span className="game-page__timer-idle">Waiting for results...</span>
          ) : status === "idle" ? (
            <span className="game-page__timer-idle">Preparing race...</span>
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

      <TypingDisplay passage={racePassage} userInput={userInput} />

      <div className="game-page__inaccuracies">
        Inaccuracies: <span>{stats.inaccuracies}</span>
      </div>
    </div>
  );
};

export default GamePage;