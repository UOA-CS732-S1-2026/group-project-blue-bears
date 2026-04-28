/**
 * Manages in-memory race rooms and registers all Socket.IO race events.
 * This module owns room membership, countdown/start flow, progress updates, and race result cleanup.
 */
import { Server, Socket } from 'socket.io';

interface JoinRoomPayload {
  roomId: string;
  userId: string;
  username: string;
}

interface StartRacePayload {
  roomId: string;
  passageText?: string;
}

interface ProgressUpdatePayload {
  roomId: string;
  userId: string;
  progress: number;
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
  username: string;
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

const DEFAULT_PASSAGE =
  'The quick brown fox jumps over the lazy dog while bright comets trace long arcs across the midnight sky.';

const buildDefaultResult = (player: RoomPlayer): FinisherResult => ({
  userId: player.userId,
  username: player.username,
  wpm: 0,
  accuracy: 0,
  finished: false,
});

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
    passageText: DEFAULT_PASSAGE,
    finishers: new Map<string, FinisherResult>(),
  };

  rooms.set(roomId, room);
  return room;
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

const emitRaceResults = (io: Server, room: RoomState): void => {
  const results = room.players.map(player => {
    const finisher = room.finishers.get(player.userId);
    return finisher ?? buildDefaultResult(player);
  });

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
    socket.on('join_room', (payload: JoinRoomPayload) => {
      const { roomId, userId, username } = payload;

      if (!roomId || !userId || !username) {
        socket.emit('error', { message: 'Invalid room join payload' });
        return;
      }

      const room = getOrCreateRoom(roomId);

      if (room.players.length >= 2) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      const existingPlayer = room.players.find(player => player.userId === userId);
      if (existingPlayer) {
        existingPlayer.socketId = socket.id;
      } else {
        room.players.push({
          socketId: socket.id,
          userId,
          username,
        });
      }

      socket.join(roomId);
      socketRoomLookup.set(socket.id, roomId);

      if (room.players.length === 2) {
        io.to(roomId).emit('room_ready', {
          roomId,
          players: room.players.map(player => ({
            userId: player.userId,
            username: player.username,
          })),
        });
      }
    });

    socket.on('start_race', (payload: StartRacePayload) => {
      const room = rooms.get(payload.roomId);

      if (!room || room.players.length < 2 || room.countdownStarted) {
        return;
      }

      room.countdownStarted = true;
      room.passageText = payload.passageText ?? DEFAULT_PASSAGE;

      // TODO: Replace this with Quotable API passage fetching once API integration is available.
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
        username: player.username,
        wpm: payload.wpm,
        accuracy: payload.accuracy,
        finished: true,
      });

      if (room.finishers.size === 1) {
        socket.to(payload.roomId).emit('opponent_finished', {
          roomId: payload.roomId,
          userId: payload.userId,
        });

        if (!room.raceTimeout) {
          room.raceTimeout = setTimeout(() => {
            const latestRoom = rooms.get(payload.roomId);
            if (!latestRoom) {
              return;
            }

            emitRaceResults(io, latestRoom);
          }, 30000);
        }
      }

      if (room.finishers.size >= 2) {
        emitRaceResults(io, room);
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
        io.to(roomId).emit('opponent_disconnected', {
          roomId,
          message: 'Your opponent disconnected from the race.',
        });
      }

      cleanupRoom(roomId);
    });
  });
};