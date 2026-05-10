import { useLocation, useNavigate } from "react-router-dom";
import ResultPage from "./ResultPage";
import useSocket from "../hooks/useSocket";
import type { GameStats } from "../hooks/useGameLogic";
import { useEffect, useState } from "react";

interface RematchStartingPayload {
  roomId: string;
  passageText: string;
  totalSeconds: number;
  countdownSeconds: number;
  startAt: number;
}

interface OpponentLeftResultScreenPayload {
  roomId: string;
  userId: string;
  message?: string;
}

interface ResultState {
  roomId?: string;
  userId?: string;
  username?: string;
  outcome: "victory" | "defeat" | "draw";
  playerStats: GameStats;
  opponentStats: GameStats;
  duration: string;
}

interface PlayerStatus {
  userId: string;
  displayName: string;
  readyForRematch: boolean;
  left: boolean;
}

function ResultRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const state = location.state as ResultState | null;
  const [playerStatuses, setPlayerStatuses] = useState<PlayerStatus[]>([]);

  // Initialize player statuses when result page loads
  useEffect(() => {
    if (!state) return;
    if (!state.roomId || !state.userId) return;

    // Initialize with both players' statuses
    const initialStatuses: PlayerStatus[] = [
      {
        userId: state.userId,
        displayName: state.username || "Player 1",
        readyForRematch: false,
        left: false,
      },
      {
        userId: "opponent",
        displayName: "Opponent",
        readyForRematch: false,
        left: false,
      },
    ];
    setPlayerStatuses(initialStatuses);
  }, [state.roomId, state.userId, state.username]);

  // Set up socket event listeners for rematch status
  useEffect(() => {
    if (!state) return;
    if (!state.roomId) return;

    const handleRematchStatusUpdated = (payload: { roomId: string; players: PlayerStatus[] }) => {
      if (payload.roomId === state.roomId) {
        setPlayerStatuses(payload.players);
      }
    };

    const handleRematchStarting = (gameStartData: RematchStartingPayload) => {
      // Navigate directly to game page with countdown and passage info
      navigate("/game", {
        state: {
          roomId: gameStartData.roomId,
          userId: state.userId,
          username: state.username,
          passageText: gameStartData.passageText,
          totalSeconds: gameStartData.totalSeconds,
          countdownSeconds: gameStartData.countdownSeconds,
          startAt: gameStartData.startAt,
        },
      });
    };

    const handleOpponentLeftResultScreen = (_payload: OpponentLeftResultScreenPayload) => {
      // Update player statuses to show opponent left
      setPlayerStatuses(prev =>
        prev.map(p => ({
          ...p,
          left: p.userId !== state.userId ? true : p.left,
        }))
      );
    };

    socket.on("rematch_status_updated", handleRematchStatusUpdated);
    socket.on("rematch_starting", handleRematchStarting);
    socket.on("opponent_left_result_screen", handleOpponentLeftResultScreen);

    return () => {
      socket.off("rematch_status_updated", handleRematchStatusUpdated);
      socket.off("rematch_starting", handleRematchStarting);
      socket.off("opponent_left_result_screen", handleOpponentLeftResultScreen);
    };
  }, [state.roomId, state.userId, state.username, navigate, socket, state]);

  const handlePlayAgain = () => {
    if (!state) return;
    if (!state.roomId || !state.userId) {
      return;
    }

    if (!socket.connected) {
      return;
    }

    // Check if opponent has left
    const opponentStatus = playerStatuses.find(p => p.userId !== state.userId);
    if (opponentStatus?.left) {
      return;
    }

    // Emit ready_for_rematch event
    socket.emit("ready_for_rematch", {
      roomId: state.roomId,
      userId: state.userId,
    });
  };

  const handleMainMenu = () => {
    if (!state) {
      navigate("/");
      return;
    }
    if (state.roomId && state.userId) {
      // Notify server that player left result screen
      socket.emit("left_result_screen", {
        roomId: state.roomId,
        userId: state.userId,
      });
    }
    navigate("/");
  };

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
      onPlayAgain={handlePlayAgain}
      onMainMenu={handleMainMenu}
      playerStatuses={playerStatuses}
      currentUserId={state.userId || ""}
    />
  );
}

export default ResultRoute;