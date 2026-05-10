import { useLocation, useNavigate } from "react-router-dom";
import ResultPage from "./ResultPage";
import useSocket from "../hooks/useSocket";
import type { GameStats } from "../hooks/useGameLogic";
import { useEffect, useState } from "react";

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

  // Initialize player statuses when result page loads
  useEffect(() => {
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
    if (!state.roomId) return;

    const handleRematchStatusUpdated = (payload: { roomId: string; players: PlayerStatus[] }) => {
      console.log("[ResultRoute] rematch_status_updated:", payload);
      if (payload.roomId === state.roomId) {
        setPlayerStatuses(payload.players);
      }
    };

    const handleRematchStarting = (gameStartData: any) => {
      console.log("[ResultRoute] rematch_starting - navigating directly to game", gameStartData);
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

    const handleOpponentLeftResultScreen = (payload: any) => {
      console.log("[ResultRoute] opponent_left_result_screen:", payload);
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
    console.log("[ResultRoute] handlePlayAgain called");
    console.log("[ResultRoute] socket.connected:", socket.connected);
    console.log("[ResultRoute] roomId:", state.roomId, "userId:", state.userId);
    
    if (!state.roomId || !state.userId) {
      console.error("[ResultRoute] Missing roomId or userId");
      return;
    }

    if (!socket.connected) {
      console.error("[ResultRoute] Socket not connected");
      return;
    }

    // Check if opponent has left
    const opponentStatus = playerStatuses.find(p => p.userId !== state.userId);
    if (opponentStatus?.left) {
      console.warn("[ResultRoute] Cannot play again - opponent has left");
      return;
    }

    // Emit ready_for_rematch event
    console.log("[ResultRoute] Emitting ready_for_rematch");
    socket.emit("ready_for_rematch", {
      roomId: state.roomId,
      userId: state.userId,
    });
  };

  const handleMainMenu = () => {
    console.log("[ResultRoute] handleMainMenu called");
    if (state.roomId && state.userId) {
      // Notify server that player left result screen
      console.log("[ResultRoute] Emitting left_result_screen");
      socket.emit("left_result_screen", {
        roomId: state.roomId,
        userId: state.userId,
      });
    }
    navigate("/");
  };

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