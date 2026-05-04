import { useState, useEffect, useRef, useCallback } from "react";

export type GameStatus = "idle" | "playing" | "finished";

export interface GameStats {
  wpm: number;
  accuracy: number;
  inaccuracies: number;
}

interface UseGameLogicOptions {
  passage: string;
  totalSeconds?: number;
  onGameEnd?: (stats: GameStats, timeElapsed: number, finishedPassage: boolean) => void;
}

interface UseGameLogicReturn {
  userInput: string;
  status: GameStatus;
  timeLeft: number;
  timeElapsed: number;
  stats: GameStats;
  start: (startAtMs?: number) => void;
  handleInput: (value: string) => void;
  reset: () => void;
}

function calcStats(passage: string, input: string, elapsedSeconds: number): GameStats {
  if (input.length === 0 || elapsedSeconds === 0) {
    return { wpm: 0, accuracy: 100, inaccuracies: 0 };
  }

  // Count inaccuracies: characters typed incorrectly at each position
  let inaccuracies = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== passage[i]) inaccuracies++;
  }

  // WPM = (correct chars typed / 5) / minutes elapsed
  const correctChars = input.length - inaccuracies;
  const minutes = elapsedSeconds / 60;
  const wpm = Math.round(correctChars / 5 / minutes);

  // Accuracy = correct chars / total typed chars
  const accuracy =
    input.length > 0 ? Math.round((correctChars / input.length) * 100) : 100;

  return { wpm, accuracy, inaccuracies };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export { formatTime };

export function useGameLogic({
  passage,
  totalSeconds = 60,
  onGameEnd,
}: UseGameLogicOptions): UseGameLogicReturn {
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [stats, setStats] = useState<GameStats>({ wpm: 0, accuracy: 100, inaccuracies: 0 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const userInputRef = useRef<string>("");

  const getElapsedSeconds = useCallback(() => {
    if (!startTimeRef.current) {
      return 0;
    }

    return Math.min(totalSeconds, Math.floor((Date.now() - startTimeRef.current) / 1000));
  }, [totalSeconds]);

  const stopGame = useCallback(
    (input: string, elapsed: number, finishedPassage: boolean) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setStatus("finished");
      const finalStats = calcStats(passage, input, elapsed);
      setStats(finalStats);
      onGameEnd?.(finalStats, elapsed, finishedPassage);
    },
    [passage, onGameEnd]
  );

  const syncTimeFromClock = useCallback(() => {
    const elapsed = getElapsedSeconds();
    const nextTimeLeft = Math.max(0, totalSeconds - elapsed);

    setTimeElapsed(elapsed);
    setTimeLeft(nextTimeLeft);

    if (elapsed >= totalSeconds) {
      stopGame(userInputRef.current, elapsed, false);
    }
  }, [getElapsedSeconds, totalSeconds, stopGame]);

  // Tick every second once playing
  useEffect(() => {
    if (status !== "playing") return;

    syncTimeFromClock();
    timerRef.current = setInterval(syncTimeFromClock, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, syncTimeFromClock]);

  // Sync userInputRef with userInput state
  useEffect(() => {
    userInputRef.current = userInput;
  }, [userInput]);

  // Recalc stats every input change while playing
  useEffect(() => {
    if (status === "playing") {
      setStats(calcStats(passage, userInput, timeElapsed));
    }
  }, [userInput, timeElapsed, passage, status]);

  const start = useCallback(
    (startAtMs?: number) => {
      if (status === "finished") {
        return;
      }

      startTimeRef.current = startAtMs ?? Date.now();
      setStatus("playing");
    },
    [status]
  );

  const handleInput = useCallback(
    (value: string) => {
      if (status !== "playing") return;
      if (value.length > passage.length) return;

      setUserInput(value);

      // Check if passage is complete
      if (value === passage) {
        const elapsed = getElapsedSeconds();
        stopGame(value, elapsed, true);
      }
    },
    [status, passage, stopGame, getElapsedSeconds]
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = null;
    setUserInput("");
    setStatus("idle");
    setTimeLeft(totalSeconds);
    setTimeElapsed(0);
    setStats({ wpm: 0, accuracy: 100, inaccuracies: 0 });
  }, [totalSeconds]);

  return { userInput, status, timeLeft, timeElapsed, stats, start, handleInput, reset };
}