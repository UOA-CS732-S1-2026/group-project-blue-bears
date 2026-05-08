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
}

const rooms = new Map<string, RoomState>();
const socketRoomLookup = new Map<string, string>();

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const RACE_DURATION_SECONDS = 60;
const PRE_RACE_COUNTDOWN_SECONDS = 3;

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


const emitRoomState = (io: Server, room: RoomState): void => {
  io.to(room.roomId).emit('room_state', {
    roomId: room.roomId,
    players: room.players.map(buildRoomPlayerPayload),
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
  const results = room.players.map(player => {
    const finisher = room.finishers.get(player.userId);
    return finisher ?? buildDefaultResult(player);
  });

  const [p1, p2] = results;
  if (
    p1 && p2 &&
    mongoose.Types.ObjectId.isValid(p1.userId) &&
    mongoose.Types.ObjectId.isValid(p2.userId)
  ) {
    const winnerId =
      p1.wpm > p2.wpm ? p1.userId :
      p2.wpm > p1.wpm ? p2.userId :
      undefined;

    try {
      await createMatchResult({
        passage: room.passageText,
        winnerId,
        player1: { userId: p1.userId, username: p1.username, wpm: p1.wpm, accuracy: p1.accuracy },
        player2: { userId: p2.userId, username: p2.username, wpm: p2.wpm, accuracy: p2.accuracy },
      });
    } catch (err) {
      console.error('Failed to save match result:', err);
    }
  }

  io.to(room.roomId).emit('race_results', {
    roomId: room.roomId,
    results,
  });

  cleanupRoom(room.roomId);
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
        socket.emit('room_created', { roomId: existingRoomId });
        return;
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

      if (!roomId || !userId) {
        socket.emit('error', { message: 'Invalid room join payload' });
        return;
      }

      const room = getOrCreateRoom(roomId);

      if (room.players.length >= 2) {
        // Inform the requester that the room is full and provide a snapshot
        socket.emit('room_full', {
          roomId,
          players: room.players.map(buildRoomPlayerPayload),
        });
        return;
      }

      const existingPlayer = room.players.find(player => player.userId === userId);
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

      socket.join(roomId);
      socketRoomLookup.set(socket.id, roomId);

      emitRoomState(io, room);

      emitRoomState(io, room);

      if (room.players.length === 2) {
        io.to(roomId).emit('room_ready', {
          roomId,
          players: room.players.map(buildRoomPlayerPayload),
        });
      }
    });

    // Allow external sockets to probe room occupancy without joining
    socket.on('probe_room', (payload: { roomId: string }) => {
      const { roomId } = payload;
      const room = rooms.get(roomId);
      socket.emit('room_probe', {
        roomId,
        players: room ? room.players.map(buildRoomPlayerPayload) : [],
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

      if (room.finishers.size === 1) {
        socket.to(payload.roomId).emit('opponent_finished', {
          roomId: payload.roomId,
          userId: payload.userId,
          wpm: payload.wpm,
          accuracy: payload.accuracy,
        });

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

      if (room.finishers.size >= 2) {
        void emitRaceResults(io, room);
      }
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