/**
 * Manages in-memory race rooms and registers all Socket.IO race events.
 * This module owns room membership, countdown/start flow, progress updates, and race result cleanup.
 */
import mongoose from 'mongoose';
import { Server, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';

const { createMatchResult } = require('../../data-access/matchDataAccess');

// Load local word list once at startup
const WORDS_PATH = path.join(__dirname, '../data/commonWords.json');
const WORD_LIST: string[] = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf-8'));
const PASSAGE_WORD_COUNT = 50;

const generatePassage = (): string => {
  const selected: string[] = [];
  for (let i = 0; i < PASSAGE_WORD_COUNT; i++) {
    selected.push(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);
  }
  return selected.join(' ');
};

interface JoinRoomPayload {
  roomId: string;
  userId: string;
  displayName?: string;
  avatarKind?: 'guest' | 'initials';
  username?: string;
}

interface CreateRoomPayload {
  userId: string;
  displayName?: string;
  avatarKind?: 'guest' | 'initials';
  username?: string;
}

interface ReadyUpPayload {
  roomId: string;
  userId: string;
}

interface StartRacePayload {
  roomId: string;
  passageText?: string;
}

interface ProgressUpdatePayload {
  roomId: string;
  userId: string;
  progress: number;
  wpm?: number;
  accuracy?: number;
}

interface RaceCompletePayload {
  roomId: string;
  userId: string;
  wpm: number;
  accuracy: number;
  finishedPassage: boolean;
}

interface RoomPlayer {
  socketId: string;
  userId: string;
  displayName: string;
  avatarKind: 'guest' | 'initials';
  ready: boolean;
}

interface FinisherResult {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  finished: boolean;
}

interface RoomState {
  roomId: string;
  players: RoomPlayer[];
  countdownStarted: boolean;
  raceStarted: boolean;
  passageText: string;
  finishers: Map<string, FinisherResult>;
  raceTimeout?: NodeJS.Timeout;
  rematchReady: Map<string, boolean>;
  playersLeftResultScreen: Set<string>;
}

const rooms = new Map<string, RoomState>();
const socketRoomLookup = new Map<string, string>();

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

const RACE_DURATION_SECONDS = 60;
const PRE_RACE_COUNTDOWN_SECONDS = 3;
// Extra time to allow clients to navigate from result -> game before startAt.
// This avoids cases where clients start sending progress updates before the server flips raceStarted.
const REMATCH_NAVIGATION_DELAY_MS = 1000;

const buildDefaultResult = (player: RoomPlayer): FinisherResult => ({
  userId: player.userId,
  username: player.displayName,
  wpm: 0,
  accuracy: 0,
  finished: false,
});

const buildRoomPlayerPayload = (player: RoomPlayer) => ({
  userId: player.userId,
  displayName: player.displayName,
  avatarKind: player.avatarKind,
  ready: player.ready,
});

const buildPlayersSnapshot = (room: RoomState) => room.players.map(buildRoomPlayerPayload);

const normalizeRoomId = (roomId: string): string => roomId.trim().toUpperCase();

const isValidRoomCodeFormat = (roomId: string): boolean => ROOM_CODE_PATTERN.test(roomId);

const normalizePlayerMetadata = (
  payload: { displayName?: string; avatarKind?: 'guest' | 'initials'; username?: string },
): { displayName: string; avatarKind: 'guest' | 'initials' } => {
  if (payload.avatarKind === 'guest') {
    return {
      displayName: 'GUEST',
      avatarKind: 'guest',
    };
  }

  const sourceName = payload.displayName || payload.username || 'PLAYER';
  return {
    displayName: sourceName.trim().toUpperCase() || 'PLAYER',
    avatarKind: payload.avatarKind ?? 'initials',
  };
};

const generateRoomCode = (): string => {
  let roomId = '';

  do {
    roomId = Array.from({ length: ROOM_CODE_LENGTH }, () => {
      const index = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
      return ROOM_CODE_ALPHABET[index];
    }).join('');
  } while (rooms.has(roomId));

  return roomId;
};

const getOrCreateRoom = (roomId: string): RoomState => {
  const existing = rooms.get(roomId);
  if (existing) {
    return existing;
  }

  const room: RoomState = {
    roomId,
    players: [],
    countdownStarted: false,
    raceStarted: false,
    passageText: '', // Generated fresh by generatePassage() inside emitGameStart
    finishers: new Map<string, FinisherResult>(),
    rematchReady: new Map<string, boolean>(),
    playersLeftResultScreen: new Set<string>(),
  };

  rooms.set(roomId, room);
  return room;
};

const emitGameStart = (io: Server, room: RoomState): void => {
  // Generate a fresh passage for each race
  room.passageText = generatePassage();
  const startAt = Date.now() + PRE_RACE_COUNTDOWN_SECONDS * 1000;

  io.to(room.roomId).emit('game_start', {
    roomId: room.roomId,
    passageText: room.passageText,
    totalSeconds: RACE_DURATION_SECONDS,
    countdownSeconds: PRE_RACE_COUNTDOWN_SECONDS,
    startAt,
  });

  // Mark the race as started after the countdown elapses so the server
  // begins accepting progress_update events at the same moment the clients do.
  setTimeout(() => {
    const activeRoom = rooms.get(room.roomId);
    if (activeRoom) {
      activeRoom.raceStarted = true;
    }
  }, PRE_RACE_COUNTDOWN_SECONDS * 1000);
};

const scheduleRaceStarted = (roomId: string, startAt: number): void => {
  const delayMs = Math.max(0, startAt - Date.now());
  setTimeout(() => {
    const activeRoom = rooms.get(roomId);
    if (activeRoom) {
      activeRoom.raceStarted = true;
    }
  }, delayMs);
};


const emitRoomState = (io: Server, room: RoomState): void => {
  io.to(room.roomId).emit('room_state', {
    roomId: room.roomId,
    players: buildPlayersSnapshot(room),
  });
};

const cleanupRoom = (roomId: string): void => {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  if (room.raceTimeout) {
    clearTimeout(room.raceTimeout);
  }

  for (const player of room.players) {
    socketRoomLookup.delete(player.socketId);
  }

  rooms.delete(roomId);
};

const emitRaceResults = async (io: Server, room: RoomState): Promise<void> => {
  room.raceStarted = false;
  const results = room.players.map(player => {
    const finisher = room.finishers.get(player.userId);
    return finisher ?? buildDefaultResult(player);
  });

  const [p1, p2] = results;
  const p1Registered = p1 && mongoose.Types.ObjectId.isValid(p1.userId);
  const p2Registered = p2 && mongoose.Types.ObjectId.isValid(p2.userId);

  if (p1 && p2 && (p1Registered || p2Registered)) {
    const winnerId =
      p1.wpm > p2.wpm ? (p1Registered ? p1.userId : undefined) :
      p2.wpm > p1.wpm ? (p2Registered ? p2.userId : undefined) :
      undefined;

    try {
      await createMatchResult({
        passage: room.passageText,
        winnerId,
        player1: { userId: p1Registered ? p1.userId : null, username: p1.username, wpm: p1.wpm, accuracy: p1.accuracy },
        player2: { userId: p2Registered ? p2.userId : null, username: p2.username, wpm: p2.wpm, accuracy: p2.accuracy },
      });
    } catch (err) {
      console.error('Failed to save match result:', err);
    }
  }

  io.to(room.roomId).emit('race_results', {
    roomId: room.roomId,
    results,
  });

  // DO NOT clean up room here - keep it alive for rematch handling
  // Schedule cleanup after 5 minutes of inactivity
  if (room.raceTimeout) {
    clearTimeout(room.raceTimeout);
  }
  room.raceTimeout = setTimeout(() => {
    console.log(`[roomManager] Auto-cleaning up room ${room.roomId} after 5 minutes of result screen time`);
    cleanupRoom(room.roomId);
  }, 5 * 60 * 1000);
};

const startCountdown = (io: Server, room: RoomState): void => {
  let current = 3;

  const countdownInterval = setInterval(() => {
    io.to(room.roomId).emit('race_countdown', {
      roomId: room.roomId,
      count: current,
    });

    current -= 1;

    if (current === 0) {
      clearInterval(countdownInterval);
      room.raceStarted = true;

      io.to(room.roomId).emit('race_start', {
        roomId: room.roomId,
        passageText: room.passageText,
      });
    }
  }, 1000);
};

export const registerSocketHandlers = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    socket.on('create_room', (payload: CreateRoomPayload) => {
      const { userId } = payload;
      const { displayName, avatarKind } = normalizePlayerMetadata(payload);

      if (!userId) {
        socket.emit('error', { message: 'Invalid room creation payload' });
        return;
      }

      const existingRoomId = socketRoomLookup.get(socket.id);
      if (existingRoomId) {
        const oldRoom = rooms.get(existingRoomId);
        if (oldRoom) {
          oldRoom.players = oldRoom.players.filter(p => p.socketId !== socket.id);
          if (oldRoom.players.length === 0) {
            cleanupRoom(existingRoomId);
          } else {
            emitRoomState(io, oldRoom);
          }
        }
        socket.leave(existingRoomId);
        socketRoomLookup.delete(socket.id);
      }

      const roomId = generateRoomCode();
      const room = getOrCreateRoom(roomId);

      room.players.push({
        socketId: socket.id,
        userId,
        displayName,
        avatarKind,
        ready: false,
      });

      socket.join(roomId);
      socketRoomLookup.set(socket.id, roomId);

      emitRoomState(io, room);

      socket.emit('room_created', {
        roomId,
      });
    });

    socket.on('join_room', (payload: JoinRoomPayload) => {
      const { roomId, userId } = payload;
      const { displayName, avatarKind } = normalizePlayerMetadata(payload);
      const normalizedRoomId = normalizeRoomId(roomId || '');

      if (!normalizedRoomId || !userId) {
        socket.emit('error', { message: 'Invalid room join payload' });
        return;
      }

      if (!isValidRoomCodeFormat(normalizedRoomId)) {
        socket.emit('error', {
          reason: 'INVALID_CODE',
          message: 'Lobby code does not exist.',
          roomId: normalizedRoomId,
        });
        return;
      }

      const room = rooms.get(normalizedRoomId);
      if (!room) {
        socket.emit('error', {
          reason: 'INVALID_CODE',
          message: 'Lobby code does not exist.',
          roomId: normalizedRoomId,
        });
        return;
      }

      const existingPlayer = room.players.find(player => player.userId === userId);
      if (!existingPlayer && room.players.length >= 2) {
        socket.emit('room_full', {
          reason: 'ROOM_FULL',
          message: 'This lobby is full.',
          retryable: false,
          roomId: normalizedRoomId,
          players: buildPlayersSnapshot(room),
        });
        return;
      }

      if (existingPlayer) {
        existingPlayer.socketId = socket.id;
        existingPlayer.displayName = displayName;
        existingPlayer.avatarKind = avatarKind;
        existingPlayer.ready = false;
      } else {
        room.players.push({
          socketId: socket.id,
          userId,
          displayName,
          avatarKind,
          ready: false,
        });
      }

      socket.join(normalizedRoomId);
      socketRoomLookup.set(socket.id, normalizedRoomId);

      emitRoomState(io, room);

      emitRoomState(io, room);

      if (room.players.length === 2) {
        io.to(normalizedRoomId).emit('room_ready', {
          roomId: normalizedRoomId,
          players: buildPlayersSnapshot(room),
        });
      }
    });

    // Allow external sockets to probe room occupancy without joining
    socket.on('probe_room', (payload: { roomId: string }) => {
      const normalizedRoomId = normalizeRoomId(payload.roomId || '');

      if (!normalizedRoomId || !isValidRoomCodeFormat(normalizedRoomId)) {
        socket.emit('room_probe', {
          exists: false,
          reason: 'INVALID_CODE',
          message: 'Lobby code does not exist.',
          roomId: normalizedRoomId,
          players: [],
        });
        return;
      }

      const room = rooms.get(normalizedRoomId);
      if (!room) {
        socket.emit('room_probe', {
          exists: false,
          reason: 'INVALID_CODE',
          message: 'Lobby code does not exist.',
          roomId: normalizedRoomId,
          players: [],
        });
        return;
      }

      socket.emit('room_probe', {
        exists: true,
        roomId: normalizedRoomId,
        players: buildPlayersSnapshot(room),
        isFull: room.players.length >= 2,
      });
    });

    socket.on('ready_up', (payload: ReadyUpPayload) => {
      const room = rooms.get(payload.roomId);

      if (!room) {
        return;
      }

      const player = room.players.find(current => current.userId === payload.userId);
      if (!player) {
        return;
      }

      player.ready = true;
      emitRoomState(io, room);

      if (room.players.length === 2 && room.players.every(current => current.ready)) {
        emitGameStart(io, room);
        for (const current of room.players) {
          current.ready = false;
        }
        emitRoomState(io, room);
      }
    });

    socket.on('start_race', (payload: StartRacePayload) => {
      const room = rooms.get(payload.roomId);

      if (!room || room.players.length < 2 || room.countdownStarted) {
        return;
      }

      room.countdownStarted = true;
      // Passage is generated server-side inside emitGameStart via generatePassage()
      startCountdown(io, room);
    });

    socket.on('progress_update', (payload: ProgressUpdatePayload) => {
      const room = rooms.get(payload.roomId);

      if (!room || !room.raceStarted) {
        return;
      }

      const clampedProgress = Math.max(0, Math.min(100, payload.progress));

      socket.to(payload.roomId).emit('opponent_progress', {
        roomId: payload.roomId,
        userId: payload.userId,
        progress: clampedProgress,
        wpm: payload.wpm ?? 0,
        accuracy: payload.accuracy ?? 100,
      });
    });

    socket.on('race_complete', (payload: RaceCompletePayload) => {
      const room = rooms.get(payload.roomId);

      if (!room || !room.raceStarted) {
        return;
      }

      if (room.finishers.has(payload.userId)) {
        return;
      }

      const player = room.players.find(current => current.userId === payload.userId);
      if (!player) {
        return;
      }

      room.finishers.set(payload.userId, {
        userId: payload.userId,
        username: player.displayName,
        wpm: payload.wpm,
        accuracy: payload.accuracy,
        finished: true,
      });

      if (room.finishers.size === 1 && payload.finishedPassage) {
        // First player finished the passage — end immediately
        void emitRaceResults(io, room);
      } else if (room.finishers.size >= 2) {
        // Both players have submitted — end now, cancelling any pending timeout
        if (room.raceTimeout) {
          clearTimeout(room.raceTimeout);
          room.raceTimeout = undefined;
        }
        void emitRaceResults(io, room);
      } else {
        // First player timed out — wait for opponent's timer race_complete (should arrive very soon)
        if (!room.raceTimeout) {
          room.raceTimeout = setTimeout(() => {
            const latestRoom = rooms.get(payload.roomId);
            if (!latestRoom) {
              return;
            }

            void emitRaceResults(io, latestRoom);
          }, 30000);
        }
      }
    });

    socket.on('ready_for_rematch', (payload: { roomId: string; userId: string }) => {
      console.log(`[roomManager] ready_for_rematch received:`, payload);
      const socketRoomId = socketRoomLookup.get(socket.id);
      if (!socketRoomId || socketRoomId !== payload.roomId) {
        return;
      }

      const room = rooms.get(payload.roomId);
      if (!room) {
        console.log(`[roomManager] Room not found for roomId: ${payload.roomId}`);
        return;
      }

      const player = room.players.find(current => current.socketId === socket.id);
      if (!player) {
        return;
      }

      // Reject rematch if anyone has left the result screen
      if (room.playersLeftResultScreen.size > 0) {
        console.log(`[roomManager] Cannot ready for rematch - players have left: ${Array.from(room.playersLeftResultScreen).join(', ')}`);
        return;
      }

      // Mark this player as ready for rematch
      room.rematchReady.set(player.userId, true);
      console.log(`[roomManager] Player ${player.userId} marked as ready. Ready players: ${room.rematchReady.size}/${room.players.length}`);

      // Emit the updated rematch statuses to both players
      const statuses = {
        roomId: payload.roomId,
        players: room.players.map(player => ({
          userId: player.userId,
          displayName: player.displayName,
          readyForRematch: room.rematchReady.get(player.userId) ?? false,
          left: false,
        })),
      };

      console.log(`[roomManager] Emitting rematch_status_updated:`, statuses);
      io.to(payload.roomId).emit('rematch_status_updated', statuses);

      // If both players are ready, reset the room and start countdown again
      if (room.rematchReady.size === room.players.length && room.players.length === 2) {
        console.log(`[roomManager] Both players ready for rematch in room ${payload.roomId}. Resetting room state...`);
        
        // Clear any pending cleanup timeout
        if (room.raceTimeout) {
          clearTimeout(room.raceTimeout);
          room.raceTimeout = undefined;
        }

        // Reset room state for new race
        room.countdownStarted = false;
        room.raceStarted = false;
        room.finishers.clear();
        room.rematchReady.clear();
        room.playersLeftResultScreen.clear();
        room.passageText = generatePassage(); // Generate new passage for next race
        
        // Reset players' ready status
        for (const player of room.players) {
          player.ready = false;
        }

        console.log(`[roomManager] Room ${payload.roomId} reset. New passage generated. Notifying players...`);

        // Send game start data directly to both players
        const startAt = Date.now() + PRE_RACE_COUNTDOWN_SECONDS * 1000 + REMATCH_NAVIGATION_DELAY_MS;
        const gameStartData = {
          roomId: payload.roomId,
          passageText: room.passageText,
          totalSeconds: RACE_DURATION_SECONDS,
          countdownSeconds: PRE_RACE_COUNTDOWN_SECONDS,
          startAt,
        };

        io.to(payload.roomId).emit('rematch_starting', gameStartData);

        // Flip raceStarted exactly at startAt so progress_update/race_complete are accepted
        // at the same moment clients consider the race started.
        scheduleRaceStarted(room.roomId, startAt);
      }
    });

    socket.on('left_result_screen', (payload: { roomId: string; userId: string }) => {
      console.log(`[roomManager] left_result_screen event received for userId: ${payload.userId} in room ${payload.roomId}`);
      const socketRoomId = socketRoomLookup.get(socket.id);
      if (!socketRoomId || socketRoomId !== payload.roomId) {
        return;
      }

      const room = rooms.get(payload.roomId);
      if (!room) {
        console.log(`[roomManager] Room not found for roomId: ${payload.roomId}`);
        return;
      }

      const player = room.players.find(current => current.socketId === socket.id);
      if (!player) {
        return;
      }

      // Mark this player as having left the result screen
      room.playersLeftResultScreen.add(player.userId);
      
      // Remove the rematch ready status for this player
      room.rematchReady.delete(player.userId);

      // Emit the updated rematch statuses
      const statuses = {
        roomId: payload.roomId,
        players: room.players.map(current => ({
          userId: current.userId,
          displayName: current.displayName,
          readyForRematch: room.rematchReady.get(current.userId) ?? false,
          left: current.userId === player.userId,
        })),
      };

      console.log(`[roomManager] Emitting opponent_left_result_screen to room ${payload.roomId}`);
      io.to(payload.roomId).emit('rematch_status_updated', statuses);
      
      // Notify the other player that opponent left
      socket.to(payload.roomId).emit('opponent_left_result_screen', {
        roomId: payload.roomId,
        userId: player.userId,
        message: 'Your opponent left the result screen.',
      });

      // Clear any pending cleanup timeout since a player left
      if (room.raceTimeout) {
        clearTimeout(room.raceTimeout);
        room.raceTimeout = undefined;
      }

      // Schedule cleanup after 30 seconds when a player leaves
      room.raceTimeout = setTimeout(() => {
        console.log(`[roomManager] Cleaning up room ${payload.roomId} after player left result screen`);
        cleanupRoom(payload.roomId);
      }, 30 * 1000);
    });

    socket.on('disconnect', () => {
      const roomId = socketRoomLookup.get(socket.id);
      if (!roomId) {
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        socketRoomLookup.delete(socket.id);
        return;
      }

      room.players = room.players.filter(player => player.socketId !== socket.id);
      socketRoomLookup.delete(socket.id);

      if (room.players.length > 0) {
        room.countdownStarted = false;
        room.raceStarted = false;
        room.finishers.clear();
        if (room.raceTimeout) {
          clearTimeout(room.raceTimeout);
          room.raceTimeout = undefined;
        }

        for (const current of room.players) {
          current.ready = false;
        }

        io.to(roomId).emit('opponent_disconnected', {
          roomId,
          message: 'Your opponent disconnected from the room.',
        });

        emitRoomState(io, room);
        return;
      }

      cleanupRoom(roomId);
    });
  });
};