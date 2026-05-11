import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TypingDisplay from "../components/TypingDisplay";
import { useGameLogic, formatTime, type GameStats } from "../hooks/useGameLogic";
import useSocket from "../hooks/useSocket";
import "./GamePage.css";
import GameCanvas from "../components/GameCanvas";

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

export interface OpponentStats {
  wpm: number;
  accuracy: number;
  progress?: number;
}

export interface PlayerStats extends GameStats {
  progress: number;
}

interface OpponentProgressPayload {
  roomId: string;
  userId: string;
  progress: number;
  wpm: number;
  accuracy: number;
}

interface FinisherResult {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  finished: boolean;
}

interface RaceResultsPayload {
  roomId: string;
  results: FinisherResult[];
}

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const inputRef = useRef<HTMLInputElement>(null);
  const locationState = (location.state as GameLocationState | null) ?? {};
  const raceStartAtRef = useRef(locationState.startAt ?? Date.now() + 3000);
  const raceStartAt = raceStartAtRef.current;
  const raceDuration = locationState.totalSeconds ?? TOTAL_SECONDS;
  const racePassage = locationState.passageText ?? "";
  const countdownSeed = locationState.countdownSeconds ?? 3;
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [didStartRace, setDidStartRace] = React.useState(false);
  const [waitingForResults, setWaitingForResults] = useState(false);
  const [playerProgress, setPlayerProgress] = React.useState<number>(0);
  const [opponentStats, setOpponentStats] = useState<OpponentStats>({ wpm: 0, accuracy: 100 });
  const elapsedRef = useRef(0);

  const { userInput, status, timeLeft, stats, start, handleInput } = useGameLogic({
    passage: racePassage,
    totalSeconds: raceDuration,
    onGameEnd: (finalStats, elapsed, finishedPassage) => {
      elapsedRef.current = elapsed;
      if (locationState.roomId && locationState.userId) {
        socket.emit("race_complete", {
          roomId: locationState.roomId,
          userId: locationState.userId,
          wpm: finalStats.wpm,
          accuracy: finalStats.accuracy,
          finishedPassage,
        });
        setWaitingForResults(true);
      }
    },
  });

  // Keep a ref of current stats so we can read them inside socket callbacks
  const statsRef = useRef(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Track timeLeft in a ref so handleRaceResults can read it without being a dep
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Emit progress_update with live wpm/accuracy every time stats change while playing
  useEffect(() => {
    if (status !== "playing" || !locationState.roomId || !locationState.userId) return;

    const progress = racePassage.length > 0
      ? Math.round((userInput.length / racePassage.length) * 100)
      : 0;
    setPlayerProgress(progress);

    socket.emit("progress_update", {
      roomId: locationState.roomId,
      userId: locationState.userId,
      progress,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.wpm, stats.accuracy, userInput.length]);

  // Listen for real-time opponent progress and final race results
  useEffect(() => {
    const handleOpponentProgress = (payload: OpponentProgressPayload) => {
      setOpponentStats({ wpm: payload.wpm, accuracy: payload.accuracy, progress: payload.progress });
    };

    const handleRaceResults = (payload: RaceResultsPayload) => {
      const myId = locationState.userId;
      const myResult = payload.results.find(r => r.userId === myId);
      const opponentResult = payload.results.find(r => r.userId !== myId);

      const finalStats = myResult ?? statsRef.current;
      const finalOpponent = opponentResult ?? { wpm: 0, accuracy: 0 };

      let outcome: "victory" | "defeat" | "draw" = "draw";
      if (finalStats.wpm > finalOpponent.wpm) outcome = "victory";
      else if (finalStats.wpm < finalOpponent.wpm) outcome = "defeat";

      navigate("/result", {
        state: {
          roomId: payload.roomId,
          userId: myId,
          username: locationState.username,
          outcome,
          playerStats: {
            wpm: finalStats.wpm,
            accuracy: finalStats.accuracy,
            inaccuracies: (finalStats as GameStats).inaccuracies ?? 0,
          },
          opponentStats: {
            wpm: finalOpponent.wpm,
            accuracy: finalOpponent.accuracy,
            inaccuracies: 0,
          },
          duration: formatTime(elapsedRef.current > 0 ? elapsedRef.current : raceDuration - timeLeftRef.current),
        },
      });
    };

    socket.on("opponent_progress", handleOpponentProgress);
    socket.on("race_results", handleRaceResults);

    return () => {
      socket.off("opponent_progress", handleOpponentProgress);
      socket.off("race_results", handleRaceResults);
    };
  }, [locationState, navigate, socket, raceDuration]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown !== null || status !== "playing") {
      return;
    }
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  };

  const handlePageClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="game-page" onClick={handlePageClick}>

      <GameCanvas
        status={status}
        playerStats={{...stats, progress: playerProgress}}
        opponentStats={opponentStats}
        raceMeta={{passage: racePassage}}
      />

      <input
        ref={inputRef}
        value={userInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
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

        {/* Opponent Stats — real data from socket */}
        <div className="game-page__player-card game-page__player-card--them">
          <div className="game-page__card-header">Them</div>
          <div className="game-page__card-stats">
            <div className="game-page__stat-item">
              <span className="game-page__stat-label">WPM</span>
              <span className="game-page__stat-value">{opponentStats.wpm}</span>
            </div>
            <div className="game-page__stat-item">
              <span className="game-page__stat-label">Accuracy</span>
              <span className="game-page__stat-value">{opponentStats.accuracy}%</span>
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
